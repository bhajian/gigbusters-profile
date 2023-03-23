import { DocumentClient, ScanInput } from 'aws-sdk/clients/dynamodb'
import { v4 as uuidv4 } from 'uuid'
import {ExternalError} from "../lib/error";
import {
    LocationEntry,
    PhotoEntry,
    PhotoParams,
    SocialParams,
    CategoryParams,
    ProfileCreateParams,
    ProfileEntity,
    SettingEntry,
    SocialEntry,
    ProfileParams
} from "./types";
import SNS from "aws-sdk/clients/sns";

interface ProfileServiceProps{
    table: string
    bucket: string
}

export class ProfileService {
    private props: ProfileServiceProps
    private documentClient = new DocumentClient()
    private sns =new SNS({apiVersion: '2010–03–31'})

    public constructor(props: ProfileServiceProps){
        this.props = props
    }

    async listProfile(userId: string): Promise<ProfileEntity[]> {
        const response = await this.documentClient
            .query({
                TableName: this.props.table,
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues : {':userId' : userId}
            }).promise()
        if (response.Items === undefined) {
            return [] as ProfileEntity[]
        }
        return response.Items as ProfileEntity[]
    }

    async getProfile(params: ProfileParams): Promise<ProfileEntity> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    userId: params.userId,
                },
            }).promise()
        if (response.Item === undefined ||
            response.Item.userId != params.userId) {
            return {} as ProfileEntity
        }
        return response.Item as ProfileEntity
    }

    async createProfile(params: ProfileCreateParams): Promise<ProfileEntity> {
        const profile: ProfileEntity = {
            active: true,
            ...params,
        }
        profile.accountCode = this.generateAccountId()

        const response = await this.documentClient
            .put({
                TableName: this.props.table,
                Item: profile,
            }).promise()
        return profile
    }

    async editProfile(params: ProfileEntity): Promise<ProfileEntity> {
        const response = await this.documentClient
            .put({
                TableName: this.props.table,
                Item: params,
                ConditionExpression: 'userId = :userId',
                ExpressionAttributeValues : {':userId' : params.userId}
            }).promise()
        return params
    }

    async deleteProfile(params: ProfileParams) {
        const response = await this.documentClient
            .delete({
                TableName: this.props.table,
                Key: {
                    userId: params.userId,
                },
                ConditionExpression: 'userId = :userId',
                ExpressionAttributeValues : {':userId' : params.userId}
            }).promise()
    }

    async deactivateProfile(params: ProfileParams) {
        const response = await this.documentClient
            .update({
                TableName: this.props.table,
                Key: {
                    userId: params.userId,
                },
                ConditionExpression: 'userId = :userId',
                UpdateExpression: 'set active=:notActive',
                ExpressionAttributeValues : {
                    ':userId' : params.userId,
                    ':notActive': false
                }
            }).promise()
    }

    async listPhotos(params: ProfileParams): Promise<string[]> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    userId: params.userId,
                },
            }).promise()
        if (response.Item === undefined ||
            response.Item.photos === undefined ||
            response.Item.userId != params.userId) {
            return [] as string[]
        }
        return response.Item.photos as string[]
    }

    async getPhoto(params: PhotoParams): Promise<PhotoEntry | {}> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    userId: params.userId,
                },
            }).promise()
        if (response.Item && response.Item.photos) {
            const photo = response.Item.photos.find(
                (item: PhotoEntry) => item.photoId === params.photoId)
            if (!photo)
                return {}
            return photo
        }
        return {}
    }

    async addPhoto(params: ProfileParams, photoParams: PhotoEntry): Promise<PhotoEntry> {
        const photoId = uuidv4()
        const newPhoto = {
            photoId: photoId,
            bucket: this.props.bucket,
            key: `${params.userId}/photos/${photoId}`,
            type: photoParams.type,
            identityId: photoParams.identityId,
        }
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    userId: params.userId,
                },
            }).promise()
        if (response.Item && response.Item.userId === params.userId) {
            if(response.Item.photos){
                if(photoParams.type === 'main'){
                    response.Item.photos.map((item: PhotoEntry) => {
                        item.type = ''
                    })
                }
                response.Item.photos.push(newPhoto)
            } else{
                response.Item.photos = [newPhoto]
            }
            await this.documentClient
                .put({
                    TableName: this.props.table,
                    Item: response.Item,
                    ConditionExpression: 'userId = :userId',
                    ExpressionAttributeValues : {':userId' : params.userId}
                }).promise()
        } else{
            throw new Error('The profile was not found for this accountId' +
                ' or the user did not match the profile owner.')
        }
        return newPhoto
    }

    async setMainPhoto(params: ProfileParams, photoParams: PhotoEntry): Promise<PhotoEntry> {
        const photoId = uuidv4()
        const newPhoto = {
            photoId: photoId,
            bucket: this.props.bucket,
            key: `${params.userId}/photos/${photoId}`,
            type: photoParams.type,
            identityId: photoParams.identityId
        }
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    userId: params.userId,
                },
            }).promise()
        if (response.Item && response.Item.userId === params.userId) {
            response.Item.photos = [newPhoto]
            await this.documentClient
                .put({
                    TableName: this.props.table,
                    Item: response.Item,
                    ConditionExpression: 'userId = :userId',
                    ExpressionAttributeValues : {':userId' : params.userId}
                }).promise()
        } else{
            throw new Error('The profile was not found for this accountId' +
                ' or the user did not match the profile owner.')
        }
        return newPhoto
    }

    async deletePhoto(params: PhotoParams) {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    userId: params.userId,
                },
            }).promise()
        const profile = response.Item
        if (profile && profile.photos) {
            const photosWithoutItem = profile.photos
                .filter((item: PhotoEntry) => item.photoId != params.photoId)
            profile.photos = photosWithoutItem
            await this.documentClient
                .put({
                    TableName: this.props.table,
                    Item: profile,
                    ConditionExpression: 'userId = :userId',
                    ExpressionAttributeValues : {':userId' : params.userId}
                }).promise()
        }
    }

    async setLocation(params: ProfileParams, location: LocationEntry):
        Promise<any> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    userId: params.userId,
                },
            }).promise()
        const profile = response.Item
        if (profile) {
            profile.location = location
            await this.documentClient
                .put({
                    TableName: this.props.table,
                    Item: profile,
                    ConditionExpression: 'userId = :userId',
                    ExpressionAttributeValues : {':userId' : params.userId}
                }).promise()
        }
    }

    async getLocation(params: ProfileParams): Promise<LocationEntry | {}> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    userId: params.userId,
                },
            }).promise()
        const profile = response.Item
        if (profile && profile.location) {
            return profile.location
        }
        return {}
    }

    async setSetting(getParams: ProfileParams, setting: SettingEntry):
        Promise<any> {
        const response = await this.documentClient
            .update({
                TableName: this.props.table,
                Key: {
                    userId: getParams.userId,
                },
                ConditionExpression: 'userId = :userId',
                UpdateExpression: 'set #set.notifications=:notifications, ' +
                    '#set.language=:language, ' +
                    '#set.country=:country',
                ExpressionAttributeNames: {
                    '#set': 'settings',
                },
                ExpressionAttributeValues: {
                    ':userId' : getParams.userId,
                    ':country': setting.country,
                    ':language': setting.language,
                    ':notifications': setting.notifications,
                }
            }).promise()
        return
    }

    async getSetting(params: ProfileParams): Promise<any> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    userId: params.userId,
                },
            }).promise()
        const profile = response.Item
        if (profile && profile.settings) {
            return profile.settings
        }
        return {}
    }

    async addSocial(params: ProfileParams, socialParams: SocialEntry): Promise<any> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    userId: params.userId,
                },
            }).promise()
        const profile = response.Item
        if (profile) {
            if(profile.socialAccounts){
                const index = profile.socialAccounts
                    .findIndex((item: SocialEntry) => (item.snName == socialParams.snName &&
                        item.socialUserId == socialParams.socialUserId))
                if(index >= 0){
                    profile.socialAccounts[index] = socialParams
                }else {
                    profile.socialAccounts.push(socialParams)
                }
            } else{
                profile.socialAccounts = [socialParams]
            }
            await this.documentClient
                .put({
                    TableName: this.props.table,
                    Item: profile,
                    ConditionExpression: 'userId = :userId',
                    ExpressionAttributeValues : {':userId' : params.userId}
                }).promise()
        } else{
            throw new Error('The profile was not found for this accountId' +
                ' or the user did not match the profile owner.')
        }
        return socialParams
    }

    async deleteSocial(params: SocialParams): Promise<any> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    userId: params.userId,
                },
            }).promise()
        const profile = response.Item
        if (profile && profile.socialAccounts) {
            const index = profile.socialAccounts
                .findIndex((item: SocialEntry) => (item.snName === params.snName &&
                    item.socialUserId === params.socialUserId))
            if(index >= 0){
                profile.socialAccounts.splice(index, 1)
                await this.documentClient
                    .put({
                        TableName: this.props.table,
                        Item: profile,
                        ConditionExpression: 'userId = :userId',
                        ExpressionAttributeValues : {':userId' : params.userId}
                    }).promise()
            }
        }
        return
    }

    async listSocial(params: ProfileParams): Promise<any> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    userId: params.userId,
                },
            }).promise()
        if (response.Item === undefined ||
            response.Item.socialAccounts === undefined) {
            return []
        }
        return response.Item.socialAccounts as SocialEntry[]
    }

    async addCategory(params: CategoryParams): Promise<any> {
        const response = await this.documentClient
            .update({
                TableName: this.props.table,
                Key: {
                    userId: params.userId,
                },
                ConditionExpression: 'userId = :userId ',
                UpdateExpression: 'ADD #ic :ic ',
                ExpressionAttributeNames: {
                    '#ic': 'interestedCategories',
                },
                ExpressionAttributeValues: {
                    ':userId' : params.userId,
                    ':ic': this.documentClient.createSet([params.category]),
                }
            }).promise()
        return
    }

    async deleteCategory(params: CategoryParams): Promise<any> {
        const response = await this.documentClient
            .update({
                TableName: this.props.table,
                Key: {
                    userId: params.userId,
                },
                ConditionExpression: 'userId = :userId ',
                UpdateExpression: 'DELETE #ic :ic ',
                ExpressionAttributeNames: {
                    '#ic': 'interestedCategories',
                },
                ExpressionAttributeValues: {
                    ':userId' : params.userId,
                    ':ic': this.documentClient.createSet([params.category]),
                }
            }).promise()
        return
        return
    }

    async listCategory(params: ProfileParams): Promise<any> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    userId: params.userId,
                },
            }).promise()
        if (response.Item === undefined ||
            response.Item.interestedCategories === undefined) {
            return [] as string[]
        }
        return response.Item.interestedCategories as string[]
    }

    async requestValidation(params: any): Promise<any> {
        try{
            const response = await this.documentClient
                .get({
                    TableName: this.props.table,
                    Key: {
                        accountId: params.accountId,
                    },
                }).promise()
            if(!response.Item){
                throw new Error('Profile does not exist.')
            }
            const profile = response.Item
            const code = this.generateRandomCode()
            if(profile && profile.phone && params.verifyObject === 'phone'){
                profile.phone.validationCode = code
                profile.phone.phone = params.phoneNumber
                profile.phone.verified = false
            }
            if(profile && profile.email && params.verifyObject === 'email'){
                profile.email.validationCode = code
                profile.phone.email = params.email
                profile.phone.verified = false
            }
            const smsParams = {
                Message: `Your Verification Code is: ${code}`,
                PhoneNumber: params.phoneNumber,
            };
            await this.sns.publish(smsParams).promise()
            await this.documentClient
                .put({
                    TableName: this.props.table,
                    Item: profile,
                    ConditionExpression: 'userId = :userId',
                    ExpressionAttributeValues : {':userId' : params.userId}
                }).promise()
            return params
        } catch (e) {
            throw e
        }
    }


    async validate(params: any): Promise<any> {
        try{
            const beforeValidation = await this.documentClient
                .get({
                    TableName: this.props.table,
                    Key: {
                        userId: params.userId,
                    },
                }).promise()
            if(!beforeValidation.Item){
                throw new Error('Profile does not exist.')
            }
            const profile = beforeValidation.Item
            let changed = false
            if(profile && profile.phone && params.verifyObject === 'phone'
                && profile.phone.validationCode === params.code){
                profile.phone.verified = true
                changed = true
            }
            if(profile && profile.email && params.verifyObject === 'email'
                && profile.email.validationCode === params.code){
                profile.phone.verified = true
                changed = true
            }
            if(changed){
                await this.documentClient
                    .put({
                        TableName: this.props.table,
                        Item: profile,
                        ConditionExpression: 'userId = :userId',
                        ExpressionAttributeValues : {':userId' : params.userId}
                    }).promise()
                return params
            } else{
                throw new Error('The profile was not verified!')
            }
        } catch (e) {
            throw e
        }
    }

    private generateAccountId(): string{
        const rand1 = Math.floor(Math.random() * 1000)
        const rand2 = Date.now()
        const number = rand2 * Math.pow(10,4) + rand1
        const strNumber = number.toString()
        return strNumber.slice(strNumber.length - 9 , strNumber.length)
    }

    private generateRandomCode(): string{
        const rand1 = Math.floor(Math.random() * 1000000)
        const strNumber = rand1.toString()
        return strNumber
    }

}
