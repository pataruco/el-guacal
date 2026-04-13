pub mod product;
pub mod store;
pub mod proposal;

use product::ProductQuery;
use store::StoreQuery;
use proposal::ProposalQuery;

#[derive(async_graphql::MergedObject, Default)]
pub struct Query(ProductQuery, StoreQuery, ProposalQuery);
