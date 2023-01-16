
const configFile = require('./dev.json')
interface Env {
    env: string | undefined
    account: string | undefined
    region: string | undefined
    apiDomainCertificateArn: string | undefined
    rootDomain: string | undefined
    apiSubdomain: string | undefined
    authDomainCertificateArn: string | undefined
    authSubdomain: string | undefined
    basePath: string | undefined
}

interface AppConfig {
    env: string
    account: string
    region: string
    apiDomainCertificateArn: string
    rootDomain: string
    apiSubdomain: string
    authDomainCertificateArn: string
    authSubdomain: string
    basePath: string
}

const getConfig = (): Env => {
    return {
        env: configFile.envNameenv ? configFile.envNameenv : 'dev' ,
        account: configFile.account ? configFile.account : 'dev' ,
        region: configFile.region ? configFile.region : 'us-east-1' ,
        apiDomainCertificateArn: configFile.apiDomainCertificateArn,
        rootDomain: configFile.rootDomain,
        apiSubdomain: configFile.apiSubdomain,
        authDomainCertificateArn: configFile.authDomainCertificateArn,
        authSubdomain: configFile.authSubdomain,
        basePath: configFile.basePath
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
