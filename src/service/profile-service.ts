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

interface ProfileServiceProps{
    table: string
}

export class ProfileService {

    private props: ProfileServiceProps
    private documentClient = new DocumentClient()

    public constructor(props: ProfileServiceProps){
        this.props = props
    }

    async listProfile(userId: string): Promise<ProfileEntity[]> {
        const response = await this.documentClient
            .query({
                TableName: this.props.table,
                IndexName: 'userIdIndex',
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
                    accountId: params.accountId,
                },
            }).promise()
        if (response.Item === undefined ||
            response.Item.userId != params.userId) {
            return {} as ProfileEntity
        }
        return response.Item as ProfileEntity
    }

    private generateRandomCode(): number{
        const rand1 = Math.floor(Math.random() * 1000)
        const rand2 = Date.now()
        let i=0
        while(Math.pow(10,i)< rand2){
            i++
        }
        return rand1 * Math.pow(10,i) + rand2
    }

    async createProfile(params: ProfileCreateParams): Promise<ProfileEntity> {
        const profile: ProfileEntity = {
            accountId: uuidv4(),
            active: true,
            ...params,
        }
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
                    accountId: params.accountId,
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
                    accountId: params.accountId,
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
                    accountId: params.accountId,
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
                    accountId: params.accountId,
                },
            }).promise()
        if (response.Item && response.Item.photos &&
            response.Item.userId == params.userId) {
            const photo = response.Item.photos.find(
                (item: PhotoEntry) => item.photoId === params.photoId)
            if (!photo)
                return {}
            return photo
        }
        return {}
    }

    async addPhoto(params: ProfileParams): Promise<PhotoEntry> {
        const newPhoto = {
            photoId: uuidv4(),
        }
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    accountId: params.accountId,
                },
            }).promise()
        if (response.Item && response.Item.userId === params.userId) {
            if(response.Item.photos){
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

    async deletePhoto(params: PhotoParams) {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    accountId: params.accountId,
                },
            }).promise()
        const profile = response.Item
        if (profile && profile.photos && profile.userId === params.userId) {
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

    async setLocation(getParams: ProfileParams, location: LocationEntry):
        Promise<any> {
        const response = await this.documentClient
            .update({
                TableName: this.props.table,
                Key: {
                    accountId: getParams.accountId,
                },
                ConditionExpression: 'userId = :userId',
                UpdateExpression: 'set #loc.latitude=:latitude, ' +
                    '#loc.longitude=:longitude',
                ExpressionAttributeNames: {
                    '#loc': 'location',
                },
                ExpressionAttributeValues: {
                    ':userId' : getParams.userId,
                    ':latitude': location.latitude,
                    ':longitude': location.longitude,
                }
            }).promise()
        return
    }

    async getLocation(params: ProfileParams): Promise<LocationEntry | {}> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    accountId: params.accountId,
                },
            }).promise()
        const profile = response.Item
        if (profile && profile.location && profile.userId === params.userId) {
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
                    accountId: getParams.accountId,
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
                    accountId: params.accountId,
                },
            }).promise()
        const profile = response.Item
        if (profile && profile.settings && profile.userId === params.userId) {
            return profile.settings
        }
        return {}
    }

    async addSocial(params: ProfileParams, socialParams: SocialEntry): Promise<any> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    accountId: params.accountId,
                },
            }).promise()
        const profile = response.Item
        if (profile && profile.userId === params.userId) {
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
                    accountId: params.accountId,
                },
            }).promise()
        const profile = response.Item
        if (profile && profile.socialAccounts && profile.userId === params.userId) {
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
                    accountId: params.accountId,
                },
            }).promise()
        if (response.Item === undefined ||
            response.Item.socialAccounts === undefined ||
            response.Item.userId != params.userId) {
            return []
        }
        return response.Item.socialAccounts as SocialEntry[]
    }

    async addCategory(params: CategoryParams): Promise<any> {
        const response = await this.documentClient
            .update({
                TableName: this.props.table,
                Key: {
                    accountId: params.accountId,
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
                    accountId: params.accountId,
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
                    accountId: params.accountId,
                },
            }).promise()
        if (response.Item === undefined ||
            response.Item.interestedCategories === undefined ||
            response.Item.userId != params.userId) {
            return [] as string[]
        }
        return response.Item.interestedCategories as string[]
    }

}
