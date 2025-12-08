import * as Joi from 'joi';

export const validationSchema = Joi.object({
	DB_HOST: Joi.string().hostname().required(),
	DB_PORT: Joi.number().port().default(5432).required(),
	DB_USER: Joi.string().required(),
	DB_PASS: Joi.string().allow('').required(),
	DB_NAME: Joi.string().required(),

	DEFAULT_USER_ID: Joi.string().uuid().required(),
	DEFAULT_NAME: Joi.string().min(3).required(),
	DEFAULT_EMAIL: Joi.string().email().required(),
	DEFAULT_PASS: Joi.string().min(6).required(),
	DEFAULT_IS_ACTIVE: Joi.boolean().required(),

	MINIO_HOST: Joi.string().required(),
	MINIO_PORT: Joi.number().required(),
	MINIO_ROOT_USER: Joi.string().required(),
	MINIO_ROOT_PASSWORD: Joi.string().required(),
	MINIO_BUCKET: Joi.string().required(),

	MAIL_SERVICE: Joi.string().required(),
	MAIL_USER: Joi.string().email().required(),
	MAIL_PASS: Joi.string().required(),

	GOOGLE_CLIENT_ID: Joi.string().required(),
	GOOGLE_CLIENT_SECRET: Joi.string().required(),
	GOOGLE_CALLBACK_URL: Joi.string().required(),

	SEPAY_MERCHANT_ID: Joi.string().required(),
	SEPAY_SECRET_KEY: Joi.string().required(),
	SEPAY_BASE_URL: Joi.string().uri().required(),
	SEPAY_CALLBACK_URL: Joi.string().uri().required(),
	SEPAY_RETURN_URL: Joi.string().uri().required(),
});
