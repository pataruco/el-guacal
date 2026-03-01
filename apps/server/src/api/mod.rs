pub mod commands;
pub mod queries;

use async_graphql::MergedObject;
use commands::store::StoreCommand;
use queries::store::StoreQuery;

#[derive(MergedObject, Default)]
pub struct Query(StoreQuery);

#[derive(MergedObject, Default)]
pub struct Mutation(StoreCommand);
