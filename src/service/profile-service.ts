import { DocumentClient, ScanInput } from 'aws-sdk/clients/dynamodb'
import { v4 as uuidv4 } from 'uuid'
import {ExternalError} from "../lib/error";
import {
    LocationEntry,
    PhotoDeletetParams,
    PhotoEntry, PhotoGetParams,
    ProfileCreateParams,
    ProfileDeleteParams,
    ProfileEditParams,
    ProfileEntity,
    ProfileGetParams
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

    async getProfile(params: ProfileGetParams): Promise<ProfileEntity> {
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

    async editProfile(params: ProfileEditParams): Promise<ProfileEntity> {
        const response = await this.documentClient
            .put({
                TableName: this.props.table,
                Item: params,
                ConditionExpression: 'userId = :userId',
                ExpressionAttributeValues : {':userId' : params.userId}
            }).promise()
        return params
    }

    async deleteProfile(params: ProfileDeleteParams) {
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

    async deactivateProfile(params: ProfileDeleteParams) {
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

    async listPhotos(params: ProfileGetParams): Promise<string[]> {
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

    async getPhoto(params: PhotoGetParams): Promise<PhotoEntry | {}> {
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

    async addPhoto(params: ProfileGetParams): Promise<PhotoEntry> {
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

    async deletePhoto(params: PhotoDeletetParams) {
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

    async setLocation(getParams: ProfileGetParams, location: LocationEntry):
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

    async getLocation(params: ProfileGetParams): Promise<LocationEntry | {}> {
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

    async setSetting(params: ProfileGetParams): Promise<any> {

        return
    }

    async getSetting(params: ProfileGetParams): Promise<any> {

        return
    }

    async addSocial(params: ProfileGetParams): Promise<any> {

        return
    }

    async deleteSocial(params: ProfileGetParams): Promise<any> {

        return
    }

    async listSocial(params: ProfileGetParams): Promise<any> {

        return
    }

    async addCategory(params: ProfileGetParams): Promise<any> {

        return
    }

    async deleteCategory(params: ProfileGetParams): Promise<any> {

        return
    }

    async listCategory(params: ProfileGetParams): Promise<any> {

        return
    }

}
