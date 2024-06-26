export interface PhoneEntry {
    phone: string
    verified: boolean
    verificationCode?: string
}
export interface EmailEntry {
    email: string
    verified: boolean
    verificationCode?: string
}
export interface LocationEntry {
    locationName: string
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
export interface SocialEntry {
    snName: string
    socialUserId: string
    token: string
    secret: string
}
export interface SettingEntry {
    notifications: boolean
    showMyEmailPublicly: boolean
    showMyPhonePublicly: boolean
    allowPublicMessages: boolean
    language: string
    country: string
}
export interface PhotoEntry {
    photoId?: string
    bucket?: string
    key?: string
    type?: string
    identityId?: string
}
export interface ProfileEntity {
    userId: string
    reviewableId?: string
    active?: boolean
    createdDateTime?: string
    accountType: string
    subscription: string
    name: string
    accountCode: string
    bio: string
    phone: PhoneEntry
    email: EmailEntry
    address: AddressEntry
    location: LocationEntry
    photos: PhotoEntry[]
    socialAccounts: SocialEntry[]
    interestedCategories: string[]
    settings: SettingEntry
}

export interface ProfileParams {
    userId: string
}
export interface PhotoParams {
    photoId: string
    userId: string
}
export interface SocialParams {
    snName: string
    socialUserId: string
    userId: string
}
export interface CategoryParams {
    category: string
    userId: string
}
