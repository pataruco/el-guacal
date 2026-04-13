pub mod store;
pub mod proposal;

use store::StoreCommand;
use proposal::ProposalCommand;

#[derive(async_graphql::MergedObject, Default)]
pub struct Mutation(StoreCommand, ProposalCommand);
