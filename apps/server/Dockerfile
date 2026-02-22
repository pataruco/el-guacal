# Stage 1: Build the Rust binary
FROM rust:1.93-slim-bookworm AS builder

# Install required build dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the entire workspace to get the moon.yml, Cargo files, etc.
COPY . .

WORKDIR /app/apps/server

# Build the release binary
RUN cargo build --release

# Stage 2: Create the tiny runtime image
FROM debian:bookworm-slim

# Install CA certificates (required for outbound HTTPS requests)
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the compiled binary from the builder stage
COPY --from=builder /app/apps/server/target/release/server /app/server

# Expose the port your config.rs uses (default 8000, but we'll let Cloud Run override it)
ENV PORT=8080
EXPOSE 8080

CMD ["./server"]
