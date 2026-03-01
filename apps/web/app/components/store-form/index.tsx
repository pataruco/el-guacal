import {
  APIProvider,
  Map as GoogleMap,
  type MapCameraChangedEvent,
} from '@vis.gl/react-google-maps';
import { Field, Form, Formik } from 'formik';
import React from 'react';
import { z } from 'zod';
import styles from './index.module.scss';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_ID = import.meta.env.VITE_GOOGLE_MAPS_ID;

const storeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  lat: z.number(),
  lng: z.number(),
  productIds: z.array(z.string()),
});

type StoreFormValues = z.infer<typeof storeSchema>;

interface StoreFormProps {
  initialValues: StoreFormValues;
  onSubmit: (values: StoreFormValues) => void;
  onCancel: () => void;
  title: string;
}

const validate = (values: StoreFormValues) => {
  try {
    storeSchema.parse(values);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.formErrors.fieldErrors;
    }
  }
  return {};
};

const StoreForm: React.FC<StoreFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  title,
}) => {
  return (
    <div className={styles.store_form}>
      <h2>{title}</h2>
      <Formik
        initialValues={initialValues}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ values, setFieldValue, errors, touched }) => (
          <Form>
            <div className={styles.field}>
              <label htmlFor="name">Name</label>
              <Field id="name" name="name" placeholder="Store Name" />
              {errors.name && touched.name && (
                <div className={styles.error}>{errors.name}</div>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="address">Address</label>
              <Field id="address" name="address" placeholder="Store Address" />
              {errors.address && touched.address && (
                <div className={styles.error}>{errors.address}</div>
              )}
            </div>

            <div className={styles.map_container}>
              <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  defaultZoom={15}
                  defaultCenter={{ lat: initialValues.lat, lng: initialValues.lng }}
                  onCameraChanged={(ev: MapCameraChangedEvent) => {
                    setFieldValue('lat', ev.detail.center.lat);
                    setFieldValue('lng', ev.detail.center.lng);
                  }}
                  mapId={GOOGLE_MAPS_ID}
                  disableDefaultUI
                />
                <div className={styles.crosshair} />
              </APIProvider>
            </div>
            <div className={styles.coordinates}>
              Lat: {values.lat.toFixed(6)}, Lng: {values.lng.toFixed(6)}
            </div>

            <div className={styles.actions}>
              <button type="button" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit">Save</button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default StoreForm;
