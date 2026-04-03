import { Combobox } from '@base-ui/react/combobox';
import {
  APIProvider,
  Map as GoogleMap,
  type MapCameraChangedEvent,
} from '@vis.gl/react-google-maps';
import { Field, type FieldProps, Form, Formik } from 'formik';
import { useCallback, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import LocateMeButton from '@/components/locate-me-button';
import { useAllProductsQuery } from '@/graphql/queries/all-products/index.generated';
import { useLazyGetReverseGeocodeQuery } from '@/store/features/google-maps/api';
import { selectMap, setCenter } from '@/store/features/map/slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import styles from './StoreForm.module.scss';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_ID = import.meta.env.VITE_GOOGLE_MAPS_ID;

const createStoreSchema = (t: (key: string) => string) =>
  z.object({
    address: z
      .string({ error: t('storeForm.validation.addressRequired') })
      .min(1, t('storeForm.validation.addressRequired')),
    lat: z.number(),
    lng: z.number(),
    name: z
      .string({ error: t('storeForm.validation.nameRequired') })
      .min(1, t('storeForm.validation.nameRequired')),
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

  const [triggerReverseGeocode] = useLazyGetReverseGeocodeQuery();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleCameraChanged = useCallback(
    (
      ev: MapCameraChangedEvent,
      setFieldValue: (field: string, value: unknown) => void,
    ) => {
      const { lat, lng } = ev.detail.center;
      setFieldValue('lat', lat);
      setFieldValue('lng', lng);
      dispatch(setCenter(ev.detail.center));

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(async () => {
        const { data: address } = await triggerReverseGeocode(`${lat},${lng}`);
        if (address) {
          setFieldValue('address', address);
        }
      }, 500);
    },
    [dispatch, triggerReverseGeocode],
  );

  const defaultValues: StoreFormValues = initialValues || {
    address: '',
    lat: center.lat,
    lng: center.lng,
    name: '',
    productIds: [],
  };

  return (
    <div className={styles['c-form-page']}>
      <Formik
        initialValues={defaultValues}
        validationSchema={toFormikValidationSchema(createStoreSchema(t))}
        onSubmit={onSubmit}
        enableReinitialize
      >
        {({ values, setFieldValue, errors, touched }) => (
          <Form>
            <div className={styles['c-form__map-section']}>
              <div className={styles['c-form__map-wrapper']}>
                <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                  <GoogleMap
                    defaultZoom={15}
                    center={{ lat: values.lat, lng: values.lng }}
                    onCameraChanged={(ev: MapCameraChangedEvent) =>
                      handleCameraChanged(ev, setFieldValue)
                    }
                    mapId={GOOGLE_MAPS_ID}
                    disableDefaultUI
                    reuseMaps
                  />
                  <div className={styles['c-form__crosshair']}>+</div>
                </APIProvider>
                <LocateMeButton />
              </div>
              <div className={styles['c-form__coordinates']}>
                Lat: {values.lat.toFixed(6)}, Lng: {values.lng.toFixed(6)}
              </div>
              <p className={styles['c-form__map-hint']}>
                {t('storeForm.mapHintLocation')}
                <br />
                {t('storeForm.mapHintAddress')}
              </p>
            </div>

            <div className={styles['c-form-container']}>
              <h1>{title}</h1>
              <div className={styles['c-form']}>
                <div className={styles['c-form__field']}>
                  <label htmlFor="name">{t('storeForm.storeName')}</label>
                  <Field
                    id="name"
                    name="name"
                    placeholder={t('storeForm.storeNamePlaceholder')}
                  />
                  {errors.name && touched.name && (
                    <div className={styles['c-form__error']} role="alert">
                      {errors.name}
                    </div>
                  )}
                </div>

                <div className={styles['c-form__field']}>
                  <label htmlFor="address">{t('storeForm.address')}</label>
                  <Field
                    id="address"
                    name="address"
                    placeholder={t('storeForm.addressPlaceholder')}
                  />
                  {errors.address && touched.address && (
                    <div className={styles['c-form__error']} role="alert">
                      {errors.address}
                    </div>
                  )}
                </div>

                <div className={styles['c-form__field']}>
                  <label htmlFor={comboboxId}>{t('storeForm.products')}</label>
                  <Field name="productIds">
                    {({ field, form }: FieldProps) => {
                      const selectedIds = field.value as string[];
                      const selectedProducts = productsData?.allProducts.filter(
                        (p) => selectedIds.includes(p.productId),
                      );

                      const filteredProducts = productsData?.allProducts.filter(
                        (p) =>
                          p.name
                            .toLowerCase()
                            .includes(searchValue.toLowerCase()),
                      );

                      return (
                        <div className={styles['c-form__combobox-wrapper']}>
                          <Combobox.Root
                            value={selectedIds}
                            onValueChange={(val) =>
                              form.setFieldValue(field.name, val)
                            }
                            onInputValueChange={setSearchValue}
                            multiple
                          >
                            <div className="o-select__control">
                              <Combobox.Input
                                id={comboboxId}
                                className="o-select__input"
                                placeholder={t('storeForm.searchProducts')}
                              />
                              <Combobox.Trigger className="o-select__control-trigger">
                                ▼
                              </Combobox.Trigger>
                            </div>
                            <Combobox.Portal>
                              <Combobox.Positioner
                                sideOffset={8}
                                className="o-select__positioner"
                              >
                                <Combobox.Popup className="o-select__popup">
                                  <Combobox.List>
                                    {filteredProducts?.map((product) => (
                                      <Combobox.Item
                                        key={product.productId}
                                        value={product.productId}
                                        className="o-select__item"
                                      >
                                        {product.name}
                                        <Combobox.ItemIndicator>
                                          ✓
                                        </Combobox.ItemIndicator>
                                      </Combobox.Item>
                                    ))}
                                  </Combobox.List>
                                  {filteredProducts?.length === 0 && (
                                    <output
                                      className={styles['c-form__no-results']}
                                    >
                                      {t('storeForm.noProductsFound')}
                                    </output>
                                  )}
                                </Combobox.Popup>
                              </Combobox.Positioner>
                            </Combobox.Portal>
                          </Combobox.Root>

                          {selectedProducts && selectedProducts.length > 0 && (
                            <ul className={styles['c-form__selected-list']}>
                              {selectedProducts.map((product) => (
                                <li
                                  key={product.productId}
                                  className={styles['c-form__selected-item']}
                                >
                                  <span>{product.name}</span>
                                  <button
                                    type="button"
                                    aria-label={`${t('storeForm.removeProduct')}: ${product.name}`}
                                    onClick={() =>
                                      form.setFieldValue(
                                        field.name,
                                        selectedIds.filter(
                                          (id) => id !== product.productId,
                                        ),
                                      )
                                    }
                                    className={
                                      styles['c-form__remove-item-btn']
                                    }
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
                    <div className={styles['c-form__error']} role="alert">
                      {errors.productIds as string}
                    </div>
                  )}
                </div>

                <div className={styles['c-form__actions']}>
                  <button
                    type="submit"
                    className={`${styles['c-form__btn']} ${styles['c-form__btn--submit']}`}
                  >
                    {t('storeForm.saveStore')}
                  </button>
                  <button
                    type="button"
                    className={`${styles['c-form__btn']} ${styles['c-form__btn--cancel']}`}
                    onClick={() => navigate(-1)}
                  >
                    {t('storeForm.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default StoreForm;
