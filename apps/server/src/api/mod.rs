pub mod commands;
pub mod export;
pub mod queries;

use async_graphql::MergedObject;
use commands::proposal::ProposalCommand;
use commands::store::StoreCommand;
use commands::user::UserCommand;
use queries::product::ProductQuery;
use queries::proposal::ProposalQuery;
use queries::store::StoreQuery;

#[derive(MergedObject, Default)]
pub struct Query(StoreQuery, ProductQuery, ProposalQuery);

#[derive(MergedObject, Default)]
pub struct Mutation(StoreCommand, ProposalCommand, UserCommand);
