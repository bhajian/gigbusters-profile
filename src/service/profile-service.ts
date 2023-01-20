import { DocumentClient, ScanInput } from 'aws-sdk/clients/dynamodb'
import { v4 as uuidv4 } from 'uuid'
import {ExternalError} from "../lib/error";
import {
    PhotoEntry,
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

    async list(userId: string): Promise<ProfileEntity[]> {
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

    async get(params: ProfileGetParams): Promise<ProfileEntity> {
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

    private generateRandom(): number{
        const rand1 = Math.floor(Math.random() * 1000)
        const rand2 = Date.now()
        let i=0
        while(Math.pow(10,i)< rand2){
            i++
        }
        return rand1 * Math.pow(10,i) + rand2
    }

    async create(params: ProfileCreateParams): Promise<ProfileEntity> {
        const profile: ProfileEntity = {
            accountId: uuidv4(),
            ...params,
        }
        const response = await this.documentClient
            .put({
                TableName: this.props.table,
                Item: profile,
            }).promise()
        return profile
    }

    async edit(params: ProfileEditParams): Promise<ProfileEntity> {
        const response = await this.documentClient
            .put({
                TableName: this.props.table,
                Item: params,
                ConditionExpression: 'userId = :userId',
                ExpressionAttributeValues : {':userId' : params.userId}
            }).promise()
        return params
    }

    async delete(params: ProfileDeleteParams) {
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

    async addPhoto(params: ProfileGetParams): Promise<PhotoEntry> {
        const newPhoto = {
            id: uuidv4(),
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
        }

        return newPhoto
    }

}
