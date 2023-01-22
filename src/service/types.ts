export interface PhoneEntry {
    phone: string
    verified: boolean
}
export interface EmailEntry {
    email: string
    verified: boolean
}
export interface LocationEntry {
    latitude: number
    longitude: number
}
export interface AddressEntry {
    country: string
    state: string
    city: string
    addressL1: string
    addressL2: string
}
export interface SocialAccount {
    snName: string
    userId: string
    token: string
    secret: string
}
export interface SettingEntry {
    notifications: boolean
    language: string
    country: string
}
export interface PhotoEntry {
    photoId: string
    bucket?: string
    key?: string
    main?: boolean
}
export interface ProfileEntity {
    accountId: string
    userId: string
    active: boolean
    accountType: string
    subscription: string
    name: string
    lastName: string
    bio: string
    phone: PhoneEntry
    email: EmailEntry
    address: AddressEntry
    location: LocationEntry
    photos: PhotoEntry[]
    socialAccounts: SocialAccount[]
    interestedCategories: string[]
    settings: SettingEntry
}
export interface ProfileCreateParams {
    userId: string
    accountType: string
    subscription: string
    name: string
    lastName: string
    bio: string
    phone: PhoneEntry
    email: EmailEntry
    address: AddressEntry
    location: LocationEntry
    photos: PhotoEntry[]
    socialAccounts: SocialAccount[]
    interestedCategories: string[]
    settings: SettingEntry
}
export interface ProfileGetParams {
    accountId: string
    userId: string
}
export interface PhotoDeletetParams {
    photoId: string
    accountId: string
    userId: string
}
export type PhotoGetParams = PhotoDeletetParams
export type ProfileEditParams = ProfileEntity
export type ProfileDeleteParams = ProfileGetParams
