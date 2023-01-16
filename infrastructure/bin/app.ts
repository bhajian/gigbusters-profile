#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProfileApiStack } from '../stack/profile-api-stack';
import {ProfileStatefulStack} from "../stack/profile-stateful-stack";

const app = new cdk.App();

const statefulStack = new ProfileStatefulStack(app, 'ProfileStatefulStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }})
new ProfileApiStack(app, 'ProfileApiStack', {
    todoAppStatefulStack: statefulStack,
}, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});
