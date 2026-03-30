import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useGetAutocompleteSuggestionsQuery,
  useLazyGetGeocodeQuery,
} from '@/store/features/google-maps/api';
import { setCenter, setZoom } from '@/store/features/map/slice';
import { useAppDispatch } from '@/store/hooks';
import styles from './index.module.scss';

const SearchBar = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    setShowSuggestions(false);
    const { data: location } = await triggerGeocode(placeId);
    if (location) {
      dispatch(setCenter(location));
      dispatch(setZoom(15));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles['c-search']} ref={containerRef}>
      <div className={styles['c-search__input-wrapper']}>
        <input
          type="text"
          className={styles['c-search__input']}
          placeholder={t('search.placeholder') || 'Search for a location...'}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
        />
        {isLoading && <div className={styles['c-search__loading']}>...</div>}
      </div>

      {showSuggestions && suggestions && suggestions.length > 0 && (
        <div className={styles['c-search__suggestions']} role="listbox">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.place_id}
              className={styles['c-search__suggestion']}
              role="option"
              aria-selected="false"
              tabIndex={0}
              onClick={() =>
                handleSelectSuggestion(
                  suggestion.place_id,
                  suggestion.description,
                )
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSelectSuggestion(
                    suggestion.place_id,
                    suggestion.description,
                  );
                }
              }}
            >
              {suggestion.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
