import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Stack} from "aws-cdk-lib";
import {ProfileApis} from "../lib/construct/profile-apis";
import {ProfileStatefulStack} from "./profile-stateful-stack";

export interface ProfileAppProps {
  profileStatefulStack: ProfileStatefulStack
}

export class ProfileApiStack extends Stack {

  public profileApis:ProfileApis

  constructor(scope: Construct, id: string, todoAppProps: ProfileAppProps, props?: cdk.StackProps) {
    super(scope, id, props);
    this.profileApis = new ProfileApis(this,id, {
      profileTable: todoAppProps.profileStatefulStack.table,
      cognito: todoAppProps.profileStatefulStack.cognito
    })
  }

}
