# 12. Frontend Form Management and Validation

## Status

Accepted

## Context

The application includes forms for adding and editing store locations. We need a way to manage form state, handle user input, and perform robust client-side validation.

## Decision

We have chosen Formik for form management and Zod for schema-based validation.

Formik simplifies the process of building and managing forms in React, while Zod allows us to define clear and type-safe validation schemas. We use `zod-formik-adapter` to integrate the two libraries seamlessly.

## Consequences

- Positive: Consistent and easy-to-use API for building and validating forms.
- Positive: Type-safe validation schemas ensure that form data is valid before it's sent to the backend.
- Positive: Improved developer productivity and reduced boilerplate for form-heavy components.
- Negative: Adds two additional dependencies to the frontend application.
- Negative: Requires learning and following Formik and Zod conventions.
