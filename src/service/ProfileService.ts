import { DocumentClient, ScanInput } from 'aws-sdk/clients/dynamodb'
import { v4 as uuidv4 } from 'uuid'
import {ExternalError} from "../lib/error";
import {ProfileCreateParams, ProfileDeleteParams, ProfileEditParams, ProfileEntity, ProfileGetParams} from "./types";

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

    async create(params: ProfileCreateParams): Promise<ProfileEntity> {
        const todo: ProfileEntity = {
            accountId: uuidv4(),
            ...params,
        }
        const response = await this.documentClient
            .put({
                TableName: this.props.table,
                Item: todo,
            }).promise()
        return todo
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
                    id: params.accountId,
                },
                ConditionExpression: 'userId = :userId',
                ExpressionAttributeValues : {':userId' : params.userId}
            }).promise()
    }

}
