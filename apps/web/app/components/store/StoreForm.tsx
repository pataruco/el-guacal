import { Combobox } from '@base-ui/react/combobox';
import {
  AdvancedMarker,
  APIProvider,
  Map as GoogleMap,
  type MapCameraChangedEvent,
} from '@vis.gl/react-google-maps';
import { Field, type FieldProps, Form, Formik } from 'formik';
import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { toFormikValidationSchema } from 'zod-formik-adapter';
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
  clientNonce: string;
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

  const clientNonce = useMemo(() => crypto.randomUUID(), []);
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
    clientNonce,
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
          <Form className={styles['c-form__layout']}>
            <div className={styles['c-form-container']}>
              <h1>{title}</h1>
              <p className={styles['c-form__subtitle']}>
                {t('storeForm.subtitle')}
              </p>

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

                <p className={styles['c-form__license']}>
                  {t('storeForm.licenseConfirmation')}
                </p>

                <div className={styles['c-form__actions']}>
                  <button
                    type="button"
                    className={`${styles['c-form__btn']} ${styles['c-form__btn--cancel']}`}
                    onClick={() => navigate(-1)}
                  >
                    {t('storeForm.cancel')}
                  </button>
                  <button
                    type="submit"
                    className={`${styles['c-form__btn']} ${styles['c-form__btn--submit']}`}
                  >
                    {t('storeForm.saveStore')}
                  </button>
                </div>
              </div>
            </div>

            {/* Map section — display-only preview of the location.
                Crosshair + lat/lng readout removed; the map shows a
                pin at the current (lat, lng). User can still drag
                the map to fine-tune; camera-changed handler updates
                lat/lng silently and reverse-geocodes the address. */}
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
                  >
                    <AdvancedMarker
                      position={{ lat: values.lat, lng: values.lng }}
                    >
                      {/* Inline Figma marker SVG (node 109:1438
                          default variant). Matches the home page
                          markers — blue teardrop, grey-300 stroke,
                          white dot centre. Without a child, the
                          AdvancedMarker falls back to Google's
                          red default pin. */}
                      <svg
                        width="32"
                        height="43"
                        viewBox="0 0 36 47.9588"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M18 44.9268L17.248 45.5869L18 46.4424L18.752 45.5869L18 44.9268ZM18 44.9268L18.752 45.5859L18.7529 45.585C18.7535 45.5843 18.754 45.5831 18.7549 45.582C18.757 45.5796 18.7607 45.5768 18.7646 45.5723C18.7727 45.563 18.7843 45.549 18.7998 45.5312C18.8309 45.4955 18.8771 45.4428 18.9365 45.374C19.0555 45.2363 19.2294 45.0336 19.4502 44.7734C19.8917 44.2531 20.5213 43.5007 21.2764 42.5713C22.7856 40.7136 24.8 38.1422 26.8164 35.291C28.8304 32.4433 30.8601 29.2966 32.3906 26.292C33.904 23.3209 34.9999 20.356 35 17.9102C35 8.56574 27.3835 1 18 1C8.61649 1 1 8.56574 1 17.9102C1.00006 20.356 2.09596 23.3209 3.60938 26.292C5.13991 29.2966 7.16959 32.4433 9.18359 35.291C11.2 38.1422 13.2144 40.7136 14.7236 42.5713C15.4787 43.5007 16.1083 44.2531 16.5498 44.7734C16.7706 45.0336 16.9445 45.2363 17.0635 45.374C17.1229 45.4428 17.1691 45.4955 17.2002 45.5312C17.2157 45.549 17.2273 45.563 17.2354 45.5723C17.2393 45.5768 17.243 45.5796 17.2451 45.582C17.246 45.5831 17.2465 45.5843 17.2471 45.585L17.248 45.5859L18 44.9268Z"
                          fill="var(--color-primary)"
                          stroke="var(--color-border)"
                          strokeWidth="2"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="4"
                          fill="var(--color-white)"
                        />
                      </svg>
                    </AdvancedMarker>
                  </GoogleMap>
                </APIProvider>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default StoreForm;
