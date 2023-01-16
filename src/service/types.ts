export interface TodoGetParams{
    id: string
    userId: string
}
export interface TodoEntity{
    id: string
    userId: string
    name: string
    description: string
    reminderDate: string
    reminderTime: string
    email: string
    phone: string
    emailReminder: boolean
    phoneReminder: boolean
}
export interface TodoCreateParams{
    userId: string
    name: string
    description: string
    reminderDate: string
    reminderTime: string
    email: string
    phone: string
    emailReminder: boolean
    phoneReminder: boolean
}

export type TodoEditParams = TodoEntity
export type TodoDeleteParams = TodoGetParams
