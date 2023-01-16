export interface ProfileGetParams {
    accountId: string
    userId: string
}
export interface ProfileEntity {
    accountId: string
    userId: string
    accountType: string
    subscription: string
    name: string
    lastName: string
    bio: string
    phone: {}
    email: {}
    address: {}
    location: {}
    photos: []
    socialAccounts: []
    interestedTopics: []
}
export interface ProfileCreateParams {
    userId: string
    accountType: string
    subscription: string
    name: string
    lastName: string
    bio: string
    phone: {}
    email: {}
    address: {}
    location: {}
    photos: []
    socialAccounts: []
    interestedTopics: []
}

export type ProfileEditParams = ProfileEntity
export type ProfileDeleteParams = ProfileGetParams
