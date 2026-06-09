// Tracking thunks — pure analytics emitters. Each thunk's only job is to
// (a) gather the parameters for one GA4 event (optionally reading state via
// getState) and (b) call `track()`. No domain dispatches, no related state
// mutations — those belong to the caller.
//
// Why thunks instead of inline track() calls in components: keeps the
// analytics taxonomy auditable in one file, and lets presentational
// components stay free of analytics imports.
//
// Note: `locate_me_result` lives in the getUserLocation thunk in
// ../map/slice.ts — its success/failure boundary is already there, and
// duplicating it would split one decision across two files.
import type { AppThunk } from '@/store/store';
import { track } from '@/utils/analytics';
import { selectMap } from '../map/slice';

// ─── Story 1: Find a product near me ────────────────────────────────

export const searchLocationSelected =
  (placeId: string): AppThunk =>
  () => {
    track('search_location_selected', { place_id: placeId });
  };

export const productFilterApplied =
  (productIds: string[]): AppThunk =>
  () => {
    if (productIds.length === 0) return;
    track('product_filter_applied', {
      product_count: productIds.length,
      product_ids: productIds.slice(0, 10).join(','),
    });
  };

// Reads the current product filter from state to derive has_active_search
// and product_count — gathering data, not mutating it. Both the marker
// click and the search-results list row dispatch this; `surface`
// disambiguates them.
export const searchResultOpened =
  (args: { storeId: string; surface: 'map' | 'list' }): AppThunk =>
  (_dispatch, getState) => {
    const { selectedProductIds } = selectMap(getState());
    track('search_result_opened', {
      has_active_search: selectedProductIds.length > 0,
      product_count: selectedProductIds.length,
      store_id: args.storeId,
      surface: args.surface,
    });
  };

// ─── Story 2: Browse what's nearby ──────────────────────────────────

export const locateMeClicked = (): AppThunk => () => {
  track('locate_me_clicked');
};

export const directionsClicked =
  (storeId: string): AppThunk =>
  () => {
    track('directions_clicked', { store_id: storeId });
  };

// ─── Story 3: Contribute a new location ─────────────────────────────

export const contributeStarted = (): AppThunk => () => {
  track('contribute_started');
};

export const contributeSubmitted =
  (productCount: number): AppThunk =>
  () => {
    track('contribute_submitted', { product_count: productCount });
  };

export const contributeFailed =
  (error: unknown): AppThunk =>
  () => {
    track('contribute_failed', {
      error_code: (error as Error)?.message?.slice(0, 50) ?? 'unknown',
    });
  };

// ─── Story 4: Keep listings honest ──────────────────────────────────

export const editStarted =
  (storeId: string): AppThunk =>
  () => {
    track('edit_started', { store_id: storeId });
  };

export const editSubmitted =
  (args: {
    addressChanged: boolean;
    nameChanged: boolean;
    productCount: number;
    productsChanged: boolean;
    storeId: string;
  }): AppThunk =>
  () => {
    track('edit_submitted', {
      address_changed: args.addressChanged,
      name_changed: args.nameChanged,
      product_count: args.productCount,
      products_changed: args.productsChanged,
      store_id: args.storeId,
    });
  };

export const editFailed =
  (args: { error: unknown; storeId: string }): AppThunk =>
  () => {
    track('edit_failed', {
      error_code: (args.error as Error)?.message?.slice(0, 50) ?? 'unknown',
      store_id: args.storeId,
    });
  };

export const deleteProposed =
  (args: { reasonLength: number; storeId: string }): AppThunk =>
  () => {
    track('delete_proposed', {
      reason_length: args.reasonLength,
      store_id: args.storeId,
    });
  };

// ─── Story 6: Dataset download ──────────────────────────────────────

export const datasetDownloadClicked =
  (snapshotDate: string): AppThunk =>
  () => {
    track('dataset_download_clicked', { snapshot_date: snapshotDate });
  };
