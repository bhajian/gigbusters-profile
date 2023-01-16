import { DocumentClient, ScanInput } from 'aws-sdk/clients/dynamodb'
import { v4 as uuidv4 } from 'uuid'
import {ExternalError} from "../lib/error";
import {TodoCreateParams, TodoDeleteParams, TodoEditParams, TodoEntity, TodoGetParams} from "./types";

interface TodoServiceProps{
    table: string
}

export class TodoService {

    private props: TodoServiceProps
    private documentClient = new DocumentClient()

    public constructor(props: TodoServiceProps){
        this.props = props
    }

    async list(userId: string): Promise<TodoEntity[]> {
        const response = await this.documentClient
            .query({
                TableName: this.props.table,
                IndexName: 'userIdIndex',
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues : {':userId' : userId}
            }).promise()
        if (response.Items === undefined) {
            return [] as TodoEntity[]
        }
        return response.Items as TodoEntity[]
    }

    async get(params: TodoGetParams): Promise<TodoEntity> {
        const response = await this.documentClient
            .get({
                TableName: this.props.table,
                Key: {
                    id: params.id,
                },
            }).promise()
        if (response.Item === undefined ||
            response.Item.userId != params.userId) {
            return {} as TodoEntity
        }
        return response.Item as TodoEntity
    }

    async create(params: TodoCreateParams): Promise<TodoEntity> {
        const todo: TodoEntity = {
            id: uuidv4(),
            ...params,
        }
        const response = await this.documentClient
            .put({
                TableName: this.props.table,
                Item: todo,
            }).promise()
        return todo
    }

    async edit(params: TodoEditParams): Promise<TodoEntity> {
        const response = await this.documentClient
            .put({
                TableName: this.props.table,
                Item: params,
                ConditionExpression: 'userId = :userId',
                ExpressionAttributeValues : {':userId' : params.userId}
            }).promise()
        return params
    }

    async delete(params: TodoDeleteParams) {
        const response = await this.documentClient
            .delete({
                TableName: this.props.table,
                Key: {
                    id: params.id,
                },
                ConditionExpression: 'userId = :userId',
                ExpressionAttributeValues : {':userId' : params.userId}
            }).promise()
    }

}
