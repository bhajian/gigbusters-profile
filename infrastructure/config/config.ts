
const configFile = require('./dev.json')
interface Env {
    envName: string | undefined
    account: string | undefined
    region: string | undefined
    apiDomainCertificateArn: string | undefined
    rootDomain: string | undefined
    apiSubdomain: string | undefined
    authDomainCertificateArn: string | undefined
    authSubdomain: string | undefined
    basePath: string | undefined
    googleClientId: string | undefined
    googleClientSecret: string | undefined
    googleMapsKey: string | undefined
    callbackUrls: any[] | undefined
    logoutUrls: any[] | undefined
    shortCodeUrl: string | undefined
    reviewableUrl: string | undefined
}

interface AppConfig {
    envName: string
    account: string
    region: string
    apiDomainCertificateArn: string
    rootDomain: string
    apiSubdomain: string
    authDomainCertificateArn: string
    authSubdomain: string
    basePath: string
    googleClientId: string
    googleClientSecret: string
    googleMapsKey: string
    callbackUrls: any[]
    logoutUrls: any[]
    shortCodeUrl: string
    reviewableUrl: string
}

const getConfig = (): Env => {
    return {
        envName: configFile.envName ? configFile.envName : 'dev' ,
        account: configFile.account ? configFile.account : 'dev' ,
        region: configFile.region ? configFile.region : 'us-east-1' ,
        apiDomainCertificateArn: configFile.apiDomainCertificateArn,
        rootDomain: configFile.rootDomain,
        apiSubdomain: configFile.apiSubdomain,
        authDomainCertificateArn: configFile.authDomainCertificateArn,
        authSubdomain: configFile.authSubdomain,
        basePath: configFile.basePath,
        googleClientId: configFile.googleClientId,
        googleClientSecret: configFile.googleClientSecret,
        googleMapsKey: configFile.googleMapsKey,
        callbackUrls: configFile.callbackUrls,
        logoutUrls: configFile.logoutUrls,
        shortCodeUrl: configFile.shortCodeUrl,
        reviewableUrl: configFile.reviewableUrl,
    };
};

const getSanitzedConfig = (config: Env): AppConfig => {
    for (const [key, value] of Object.entries(config)) {
        if (value === undefined) {
            throw new Error(`Missing key ${key} in config file`);
        }
    }
    return config as AppConfig;
};

const sanitizedConfig = getSanitzedConfig(getConfig());

export default sanitizedConfig;
