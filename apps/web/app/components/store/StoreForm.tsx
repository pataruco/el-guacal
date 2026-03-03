import { Combobox } from '@base-ui/react/combobox';
import {
  APIProvider,
  Map as GoogleMap,
  type MapCameraChangedEvent,
} from '@vis.gl/react-google-maps';
import { Field, type FieldProps, Form, Formik } from 'formik';
import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { toFormikValidationSchema } from 'zod-formik-adapter';

import { useAllProductsQuery } from '@/graphql/queries/all-products/index.generated';
import { selectMap, setCenter } from '@/store/features/map/slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import styles from './StoreForm.module.scss';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_ID = import.meta.env.VITE_GOOGLE_MAPS_ID;

const storeSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  lat: z.number(),
  lng: z.number(),
  name: z.string().min(1, 'Name is required'),
  productIds: z.array(z.string()).min(1, 'Select at least one product'),
});

type StoreFormValues = z.infer<typeof storeSchema>;

interface StoreFormProps {
  initialValues?: StoreFormValues;
  onSubmit: (values: StoreFormValues) => void;
  title: string;
}

const StoreForm: React.FC<StoreFormProps> = ({
  initialValues,
  onSubmit,
  title,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { center } = useAppSelector(selectMap);
  const { data: productsData } = useAllProductsQuery();
  const [searchValue, setSearchValue] = useState('');
  const comboboxId = useId();

  const defaultValues: StoreFormValues = initialValues || {
    address: '',
    lat: center.lat,
    lng: center.lng,
    name: '',
    productIds: [],
  };

  return (
    <div className={styles.container}>
      <h1>{title}</h1>
      <Formik
        initialValues={defaultValues}
        validationSchema={toFormikValidationSchema(storeSchema)}
        onSubmit={onSubmit}
        enableReinitialize
      >
        {({ values, setFieldValue, errors, touched }) => (
          <Form className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="name">Store Name</label>
              <Field id="name" name="name" placeholder="Store Name" />
              {errors.name && touched.name && (
                <div className={styles.error}>{errors.name}</div>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="address">Address</label>
              <Field id="address" name="address" placeholder="Address" />
              {errors.address && touched.address && (
                <div className={styles.error}>{errors.address}</div>
              )}
            </div>

            <div className={styles.mapField}>
              <p className={styles.label}>Location</p>
              <div className={styles.mapWrapper}>
                <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                  <GoogleMap
                    defaultZoom={15}
                    center={{ lat: values.lat, lng: values.lng }}
                    onCameraChanged={(ev: MapCameraChangedEvent) => {
                      setFieldValue('lat', ev.detail.center.lat);
                      setFieldValue('lng', ev.detail.center.lng);
                      dispatch(setCenter(ev.detail.center));
                    }}
                    mapId={GOOGLE_MAPS_ID}
                    disableDefaultUI
                    reuseMaps
                  />
                  <div className={styles.crosshair}>+</div>
                </APIProvider>
              </div>
              <div className={styles.coordinates}>
                Lat: {values.lat.toFixed(6)}, Lng: {values.lng.toFixed(6)}
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor={comboboxId}>Products</label>
              <Field name="productIds">
                {({ field, form }: FieldProps) => {
                  const selectedIds = field.value as string[];
                  const selectedProducts = productsData?.allProducts.filter(
                    (p) => selectedIds.includes(p.productId),
                  );

                  const filteredProducts = productsData?.allProducts.filter(
                    (p) =>
                      p.name.toLowerCase().includes(searchValue.toLowerCase()),
                  );

                  return (
                    <div className={styles.comboboxWrapper}>
                      <Combobox.Root
                        value={selectedIds}
                        onValueChange={(val) =>
                          form.setFieldValue(field.name, val)
                        }
                        onInputValueChange={setSearchValue}
                        multiple
                      >
                        <div className={styles.comboboxControl}>
                          <Combobox.Input
                            id={comboboxId}
                            className={styles.comboboxInput}
                            placeholder="Search products..."
                          />
                          <Combobox.Trigger className={styles.comboboxTrigger}>
                            ▼
                          </Combobox.Trigger>
                        </div>
                        <Combobox.Portal>
                          <Combobox.Positioner
                            className={styles.selectPositioner}
                          >
                            <Combobox.Popup className={styles.selectPopup}>
                              {filteredProducts?.map((product) => (
                                <Combobox.Item
                                  key={product.productId}
                                  value={product.productId}
                                  className={styles.selectItem}
                                >
                                  {product.name}
                                  <Combobox.ItemIndicator>
                                    ✓
                                  </Combobox.ItemIndicator>
                                </Combobox.Item>
                              ))}
                              {filteredProducts?.length === 0 && (
                                <div className={styles.noResults}>
                                  No products found
                                </div>
                              )}
                            </Combobox.Popup>
                          </Combobox.Positioner>
                        </Combobox.Portal>
                      </Combobox.Root>

                      {selectedProducts && selectedProducts.length > 0 && (
                        <ul className={styles.selectedList}>
                          {selectedProducts.map((product) => (
                            <li
                              key={product.productId}
                              className={styles.selectedItem}
                            >
                              <span>{product.name}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  form.setFieldValue(
                                    field.name,
                                    selectedIds.filter(
                                      (id) => id !== product.productId,
                                    ),
                                  )
                                }
                                className={styles.removeItemBtn}
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                }}
              </Field>
              {errors.productIds && touched.productIds && (
                <div className={styles.error}>
                  {errors.productIds as string}
                </div>
              )}
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.submitBtn}>
                Save Store
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default StoreForm;
