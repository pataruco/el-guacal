use server::create_schema;
use sqlx::PgPool;
use std::fs::File;
use std::io::Write;

#[tokio::main]
async fn main() {
    let schema = create_schema(PgPool::connect_lazy("postgres://localhost/db").unwrap(), None);
    let mut file = File::create("schema.graphql").unwrap();
    file.write_all(schema.sdl().as_bytes()).unwrap();
}
