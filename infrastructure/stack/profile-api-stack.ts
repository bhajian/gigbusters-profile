import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Stack} from "aws-cdk-lib";
import {ProfileApis} from "../lib/construct/profile-apis";
import {ProfileStatefulStack} from "./profile-stateful-stack";
import {FameorbitCognito} from "../lib/construct/fameorbit-cognito";


export interface TodoAppProps{
  todoAppStatefulStack: ProfileStatefulStack
}

export class ProfileApiStack extends Stack {

  public todoApis:ProfileApis

  constructor(scope: Construct, id: string, todoAppProps: TodoAppProps,  props?: cdk.StackProps) {
    super(scope, id, props);
    this.todoApis = new ProfileApis(this,id, {
      profileTable: todoAppProps.todoAppStatefulStack.profileTable,
      cognito: todoAppProps.todoAppStatefulStack.cognito
    })
  }


}
