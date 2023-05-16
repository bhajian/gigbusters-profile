#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProfileApiStack } from '../stack/profile-api-stack';
import {ProfileStatefulStack} from "../stack/profile-stateful-stack";
import config from "../config/config";

const app = new cdk.App()

const statefulStack = new ProfileStatefulStack(app, `ProfileStatefulStack-${config.envName}`, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }})
new ProfileApiStack(app, `ProfileApiStack-${config.envName}`, {
    profileStatefulStack: statefulStack,
}, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});
