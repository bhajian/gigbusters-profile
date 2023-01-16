import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Stack} from "aws-cdk-lib";
import {ProfileApis} from "../lib/construct/profile-apis";
import {TodoAppStatefulStack} from "./todo-app-stateful-stack";
import {FameorbitCognito} from "../lib/construct/fameorbit-cognito";


export interface TodoAppProps{
  todoAppStatefulStack: TodoAppStatefulStack
}

export class TodoAppStack extends Stack {

  public todoApis:ProfileApis

  constructor(scope: Construct, id: string, todoAppProps: TodoAppProps,  props?: cdk.StackProps) {
    super(scope, id, props);
    this.todoApis = new ProfileApis(this,id, {
      todoTable: todoAppProps.todoAppStatefulStack.profileTable,
      cognito: todoAppProps.todoAppStatefulStack.cognito
    })
  }


}
