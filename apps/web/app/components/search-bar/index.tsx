import { Combobox } from '@base-ui/react/combobox';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useGetAutocompleteSuggestionsQuery,
  useLazyGetGeocodeQuery,
} from '@/store/features/google-maps/api';
import { setCenter, setZoom } from '@/store/features/map/slice';
import { useAppDispatch } from '@/store/hooks';
import styles from './index.module.scss';

interface Suggestion {
  place_id: string;
  description: string;
}

const SearchBar = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data: suggestions, isLoading } = useGetAutocompleteSuggestionsQuery(
    debouncedValue,
    {
      skip: debouncedValue.length < 3,
    },
  );

  const [triggerGeocode] = useLazyGetGeocodeQuery();

  const handleSelectSuggestion = async (
    placeId: string,
    description: string,
  ) => {
    setInputValue(description);
    const { data: location } = await triggerGeocode(placeId);
    if (location) {
      dispatch(setCenter(location));
      dispatch(setZoom(15));
    }
  };

  return (
    <div className={styles['c-search']}>
      <Combobox.Root
        items={suggestions || []}
        inputValue={inputValue}
        onInputValueChange={setInputValue}
        itemToStringLabel={(item: Suggestion) => item.description}
        onValueChange={(value: Suggestion | null) => {
          if (value) {
            handleSelectSuggestion(value.place_id, value.description);
          }
        }}
      >
        <div className={styles['c-search__input-wrapper']}>
          <Combobox.Input
            className={`o-select__trigger ${styles['c-search__input']}`}
            placeholder={t('search.placeholder')}
            aria-label={t('search.placeholder')}
          />
          {isLoading && (
            <output className={styles['c-search__loading']} aria-live="polite">
              <span className="sr-only">{t('search.loading')}</span>
              ...
            </output>
          )}
        </div>

        {suggestions && suggestions.length > 0 && (
          <Combobox.Portal>
            <Combobox.Positioner
              sideOffset={8}
              className="o-select__positioner"
            >
              <Combobox.Popup className="o-select__popup">
                <Combobox.List className={styles['c-search__suggestions']}>
                  {(suggestion: Suggestion) => (
                    <Combobox.Item
                      key={suggestion.place_id}
                      value={suggestion}
                      className="o-select__item"
                    >
                      <span>{suggestion.description}</span>
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        )}
      </Combobox.Root>
    </div>
  );
};

export default SearchBar;
