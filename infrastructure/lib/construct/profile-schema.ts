import {JsonSchemaType} from "aws-cdk-lib/aws-apigateway";

export const createProfileSchema = {
    type: JsonSchemaType.OBJECT,
    required: [
        "accountType", "subscription", "name", "email",
    ],
    properties: {
        accountType: {
            type: JsonSchemaType.STRING
        },
        subscription: {
            type: JsonSchemaType.STRING
        },
        name: {
            type: JsonSchemaType.STRING
        },
        accountCode: {
            type: JsonSchemaType.STRING
        },
        bio: {
            type: JsonSchemaType.STRING
        },
        phone: {
            type: JsonSchemaType.OBJECT,
            required: ["phone", "verified"],
            properties: {
                phone: {
                    type: JsonSchemaType.STRING
                },
                verified: {
                    type: JsonSchemaType.BOOLEAN
                },
            }
        },
        email: {
            type: JsonSchemaType.OBJECT,
            required: ["email", "verified"],
            properties: {
                email: {
                    type: JsonSchemaType.STRING
                },
                verified: {
                    type: JsonSchemaType.BOOLEAN
                },
            }
        },
        address: {
            type: JsonSchemaType.OBJECT,
            required: ["country", "state", "city", "addressL1"],
            properties: {
                country: {
                    type: JsonSchemaType.STRING
                },
                state: {
                    type: JsonSchemaType.STRING
                },
                city: {
                    type: JsonSchemaType.STRING
                },
                addressL1: {
                    type: JsonSchemaType.STRING
                },
                addressL2: {
                    type: JsonSchemaType.STRING
                },
            }
        },
        location: {
            type: JsonSchemaType.OBJECT,
            required: ["latitude", "longitude"],
            properties: {
                latitude: {
                    type: JsonSchemaType.NUMBER,
                },
                longitude: {
                    type: JsonSchemaType.NUMBER
                },
            }
        },
        photos: {
            type: JsonSchemaType.ARRAY,
            items: {
                type: JsonSchemaType.OBJECT
            }
        },
        socialAccounts: {
            type: JsonSchemaType.ARRAY,
            items: {
                type: JsonSchemaType.OBJECT,
                properties: {
                    snName: {
                        type: JsonSchemaType.STRING,
                    },
                    userId: {
                        type: JsonSchemaType.STRING
                    },
                    token: {
                        type: JsonSchemaType.STRING
                    },
                    secret: {
                        type: JsonSchemaType.STRING
                    },
                }
            }
        },
        interestedCategories: {
            type: JsonSchemaType.ARRAY,
            items: {
                type: JsonSchemaType.STRING
            }
        },
        settings: {
            type: JsonSchemaType.OBJECT,
            required: ["country", "language", "notifications"],
            properties: {
                country: {
                    type: JsonSchemaType.STRING,
                },
                language: {
                    type: JsonSchemaType.STRING
                },
                notifications: {
                    type: JsonSchemaType.BOOLEAN
                },
            }
        }
    },
}

export const editProfileSchema = {
    type: JsonSchemaType.OBJECT,
    required: [
        "userId", "accountType", "subscription", "name", "email",
    ],
    properties: {
        userId: {
            type: JsonSchemaType.STRING
        },
        accountType: {
            type: JsonSchemaType.STRING
        },
        subscription: {
            type: JsonSchemaType.STRING
        },
        name: {
            type: JsonSchemaType.STRING
        },
        accountCode: {
            type: JsonSchemaType.STRING
        },
        bio: {
            type: JsonSchemaType.STRING
        },
        phone: {
            type: JsonSchemaType.OBJECT,
            required: ["phone", "verified"],
            properties: {
                phone: {
                    type: JsonSchemaType.STRING
                },
                verified: {
                    type: JsonSchemaType.BOOLEAN
                },
            }
        },
        email: {
            type: JsonSchemaType.OBJECT,
            required: ["email", "verified"],
            properties: {
                email: {
                    type: JsonSchemaType.STRING
                },
                verified: {
                    type: JsonSchemaType.BOOLEAN
                },
            }
        },
        address: {
            type: JsonSchemaType.OBJECT,
            required: ["country", "state", "city", "addressL1"],
            properties: {
                country: {
                    type: JsonSchemaType.STRING
                },
                state: {
                    type: JsonSchemaType.STRING
                },
                city: {
                    type: JsonSchemaType.STRING
                },
                addressL1: {
                    type: JsonSchemaType.STRING
                },
                addressL2: {
                    type: JsonSchemaType.STRING
                },
            }
        },
        location: {
            type: JsonSchemaType.OBJECT,
            required: ["latitude", "longitude"],
            properties: {
                latitude: {
                    type: JsonSchemaType.NUMBER,
                },
                longitude: {
                    type: JsonSchemaType.NUMBER
                },
            }
        },
        photos: {
            type: JsonSchemaType.ARRAY,
            items: {
                type: JsonSchemaType.OBJECT
            }
        },
        socialAccounts: {
            type: JsonSchemaType.ARRAY,
            items: {
                type: JsonSchemaType.OBJECT,
                properties: {
                    snName: {
                        type: JsonSchemaType.STRING,
                    },
                    userId: {
                        type: JsonSchemaType.STRING
                    },
                    token: {
                        type: JsonSchemaType.STRING
                    },
                    secret: {
                        type: JsonSchemaType.STRING
                    },
                }
            }
        },
        interestedCategories: {
            type: JsonSchemaType.ARRAY,
            items: {
                type: JsonSchemaType.STRING
            }
        },
        settings: {
            type: JsonSchemaType.OBJECT,
            required: ["country", "language", "notifications"],
            properties: {
                country: {
                    type: JsonSchemaType.STRING,
                },
                language: {
                    type: JsonSchemaType.STRING
                },
                notifications: {
                    type: JsonSchemaType.BOOLEAN
                },
            }
        }
    },
}
