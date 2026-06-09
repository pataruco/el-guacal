import { beforeEach, describe, expect, it } from 'vitest';
import { makeStore } from '@/store/store';
import { setSelectedProductIds } from '../../map/slice';
import {
  contributeFailed,
  contributeStarted,
  contributeSubmitted,
  datasetDownloadClicked,
  deleteProposed,
  directionsClicked,
  editFailed,
  editStarted,
  editSubmitted,
  locateMeClicked,
  productFilterApplied,
  searchLocationSelected,
  searchResultOpened,
} from '../thunks';

type DataLayerWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
};

const dataLayer = () => (window as DataLayerWindow).dataLayer ?? [];

describe('tracking thunks', () => {
  beforeEach(() => {
    (window as DataLayerWindow).dataLayer = [];
  });

  describe('searchLocationSelected', () => {
    it('pushes search_location_selected with place_id', () => {
      const store = makeStore();
      store.dispatch(searchLocationSelected('place-abc'));

      expect(dataLayer()).toEqual([
        { event: 'search_location_selected', place_id: 'place-abc' },
      ]);
    });
  });

  describe('productFilterApplied', () => {
    it('pushes product_count and product_ids', () => {
      const store = makeStore();
      store.dispatch(productFilterApplied(['p1', 'p2']));

      expect(dataLayer()).toEqual([
        {
          event: 'product_filter_applied',
          product_count: 2,
          product_ids: 'p1,p2',
        },
      ]);
    });

    it('caps product_ids at 10 entries while keeping the true count', () => {
      const ids = Array.from({ length: 15 }, (_, i) => `p${i}`);
      const store = makeStore();
      store.dispatch(productFilterApplied(ids));

      const [event] = dataLayer();
      expect(event.product_count).toBe(15);
      expect((event.product_ids as string).split(',')).toHaveLength(10);
    });

    it('does not push when productIds is empty', () => {
      const store = makeStore();
      store.dispatch(productFilterApplied([]));

      expect(dataLayer()).toEqual([]);
    });
  });

  describe('searchResultOpened', () => {
    it('derives has_active_search and product_count from the map slice', () => {
      const store = makeStore();
      store.dispatch(setSelectedProductIds(['p1', 'p2']));
      store.dispatch(searchResultOpened({ storeId: 's-1', surface: 'map' }));

      expect(dataLayer()).toEqual([
        {
          event: 'search_result_opened',
          has_active_search: true,
          product_count: 2,
          store_id: 's-1',
          surface: 'map',
        },
      ]);
    });

    it('reports has_active_search false when the filter is empty', () => {
      const store = makeStore();
      store.dispatch(searchResultOpened({ storeId: 's-2', surface: 'list' }));

      const [event] = dataLayer();
      expect(event.has_active_search).toBe(false);
      expect(event.product_count).toBe(0);
    });

    // Separation-of-concerns regression: a tracking thunk must not mutate
    // domain state. If a future change accidentally re-introduces a
    // setStoreId/setShowStore dispatch in here, this test fails.
    it('does not mutate the store slice', () => {
      const store = makeStore();
      store.dispatch(searchResultOpened({ storeId: 's-3', surface: 'map' }));

      const state = store.getState();
      expect(state.store.storeId).toBe('');
      expect(state.store.show).toBe(false);
    });
  });

  describe('locateMeClicked', () => {
    it('pushes locate_me_clicked with no params', () => {
      const store = makeStore();
      store.dispatch(locateMeClicked());

      expect(dataLayer()).toEqual([{ event: 'locate_me_clicked' }]);
    });

    // Separation-of-concerns regression: a tracking thunk must not kick
    // off the geolocation request. The component does that separately.
    it('does not change userLocationStatus', () => {
      const store = makeStore();
      store.dispatch(locateMeClicked());

      expect(store.getState().map.userLocationStatus).toBe('idle');
    });
  });

  describe('directionsClicked', () => {
    it('pushes with store_id', () => {
      const store = makeStore();
      store.dispatch(directionsClicked('s-7'));

      expect(dataLayer()).toEqual([
        { event: 'directions_clicked', store_id: 's-7' },
      ]);
    });
  });

  describe('contributeStarted', () => {
    it('pushes with no params', () => {
      const store = makeStore();
      store.dispatch(contributeStarted());

      expect(dataLayer()).toEqual([{ event: 'contribute_started' }]);
    });
  });

  describe('contributeSubmitted', () => {
    it('pushes product_count', () => {
      const store = makeStore();
      store.dispatch(contributeSubmitted(4));

      expect(dataLayer()).toEqual([
        { event: 'contribute_submitted', product_count: 4 },
      ]);
    });
  });

  describe('contributeFailed', () => {
    it('normalises Error.message to error_code (sliced to 50 chars)', () => {
      const longMessage = 'x'.repeat(120);
      const store = makeStore();
      store.dispatch(contributeFailed(new Error(longMessage)));

      const [event] = dataLayer();
      expect((event.error_code as string).length).toBe(50);
    });

    it('falls back to "unknown" for non-Error input', () => {
      const store = makeStore();
      store.dispatch(contributeFailed('not an error'));

      expect(dataLayer()).toEqual([
        { error_code: 'unknown', event: 'contribute_failed' },
      ]);
    });
  });

  describe('editStarted', () => {
    it('pushes store_id', () => {
      const store = makeStore();
      store.dispatch(editStarted('s-9'));

      expect(dataLayer()).toEqual([{ event: 'edit_started', store_id: 's-9' }]);
    });
  });

  describe('editSubmitted', () => {
    it('pushes all diff flags', () => {
      const store = makeStore();
      store.dispatch(
        editSubmitted({
          addressChanged: true,
          nameChanged: false,
          productCount: 3,
          productsChanged: true,
          storeId: 's-5',
        }),
      );

      expect(dataLayer()).toEqual([
        {
          address_changed: true,
          event: 'edit_submitted',
          name_changed: false,
          product_count: 3,
          products_changed: true,
          store_id: 's-5',
        },
      ]);
    });
  });

  describe('editFailed', () => {
    it('pushes store_id and error_code', () => {
      const store = makeStore();
      store.dispatch(editFailed({ error: new Error('boom'), storeId: 's-6' }));

      expect(dataLayer()).toEqual([
        { error_code: 'boom', event: 'edit_failed', store_id: 's-6' },
      ]);
    });
  });

  describe('deleteProposed', () => {
    it('pushes store_id and reason_length', () => {
      const store = makeStore();
      store.dispatch(deleteProposed({ reasonLength: 42, storeId: 's-8' }));

      expect(dataLayer()).toEqual([
        { event: 'delete_proposed', reason_length: 42, store_id: 's-8' },
      ]);
    });
  });

  describe('datasetDownloadClicked', () => {
    it('pushes snapshot_date', () => {
      const store = makeStore();
      store.dispatch(datasetDownloadClicked('2026-06-09'));

      expect(dataLayer()).toEqual([
        {
          event: 'dataset_download_clicked',
          snapshot_date: '2026-06-09',
        },
      ]);
    });
  });
});
