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

	EMAIL_SERVICE: Joi.string().required(),
	EMAIL_USER: Joi.string().email().required(),
	EMAIL_PASS: Joi.string().required(),
});
