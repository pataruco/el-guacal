import { Combobox } from '@base-ui/react/combobox';
import {
  APIProvider,
  Map as GoogleMap,
  type MapCameraChangedEvent,
} from '@vis.gl/react-google-maps';
import { Field, type FieldProps, Form, Formik } from 'formik';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { toFormikValidationSchema } from 'zod-formik-adapter';

import { useAllProductsQuery } from '@/graphql/queries/all-products/index.generated';
import { selectMap, setCenter } from '@/store/features/map/slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import styles from './StoreForm.module.scss';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_ID = import.meta.env.VITE_GOOGLE_MAPS_ID;

const createStoreSchema = (t: (key: string) => string) =>
  z.object({
    address: z.string().min(1, t('storeForm.validation.addressRequired')),
    lat: z.number(),
    lng: z.number(),
    name: z.string().min(1, t('storeForm.validation.nameRequired')),
    productIds: z
      .array(z.string())
      .min(1, t('storeForm.validation.productRequired')),
  });

type StoreFormValues = {
  address: string;
  lat: number;
  lng: number;
  name: string;
  productIds: string[];
};

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
  const { t } = useTranslation();
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
        validationSchema={toFormikValidationSchema(createStoreSchema(t))}
        onSubmit={onSubmit}
        enableReinitialize
      >
        {({ values, setFieldValue, errors, touched }) => (
          <Form className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="name">{t('storeForm.storeName')}</label>
              <Field
                id="name"
                name="name"
                placeholder={t('storeForm.storeName')}
              />
              {errors.name && touched.name && (
                <div className={styles.error}>{errors.name}</div>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="address">{t('storeForm.address')}</label>
              <Field
                id="address"
                name="address"
                placeholder={t('storeForm.address')}
              />
              {errors.address && touched.address && (
                <div className={styles.error}>{errors.address}</div>
              )}
            </div>

            <div className={styles.mapField}>
              <p className={styles.label}>{t('storeForm.location')}</p>
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
              <label htmlFor={comboboxId}>{t('storeForm.products')}</label>
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
                            placeholder={t('storeForm.searchProducts')}
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
                                  {t('storeForm.noProductsFound')}
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
                {t('storeForm.saveStore')}
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => navigate(-1)}
              >
                {t('storeForm.cancel')}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default StoreForm;
