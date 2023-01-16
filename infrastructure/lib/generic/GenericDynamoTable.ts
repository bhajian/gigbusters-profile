import {RemovalPolicy, Stack, StackProps} from "aws-cdk-lib";
import {AttributeType, StreamViewType, Table} from "aws-cdk-lib/aws-dynamodb";
import {Effect, IGrantable, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {Construct} from "constructs";
import config from "../../config/config";

export interface GenericTableProps {
    tableName: string
    primaryKey: string
    keyType: AttributeType
    stream?: StreamViewType
}

export interface SecondaryIndexProp {
    indexName: string
    partitionKeyName: string
    keyType: AttributeType
}

export class GenericDynamoTable extends Construct {

    public table: Table;
    private props: GenericTableProps

    public constructor(scope: Construct, id: string, props: GenericTableProps){
        super(scope, id)
        this.props = props

        this.table = new Table(this, id, {
            removalPolicy: RemovalPolicy.DESTROY,
            partitionKey: {
                name: this.props.primaryKey,
                type: AttributeType.STRING
            },
            stream: props.stream,
            tableName: config.account + '-' + config.env + '-' + this.props.tableName
        })
    }

    public addSecondaryIndexes(options: SecondaryIndexProp){
        if (options) {
            this.table.addGlobalSecondaryIndex({
                indexName: options.indexName,
                partitionKey: {
                    name: options.partitionKeyName,
                    type: options.keyType
                }
            })
        }
    }

}
