# Gunakan image Golang resmi sebagai builder
FROM golang:1.25-alpine AS builder

# Set working directory
WORKDIR /app

# Copy go mod dan sum file
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy seluruh source code
COPY . .

# Build aplikasi menjadi binary bernama 'main'
RUN go build -o main .

# Gunakan image alpine yang ringan untuk menjalankan aplikasi
FROM alpine:latest
WORKDIR /app

# Copy binary dari builder
COPY --from=builder /app/main .
# Copy folder uploads (opsional, tapi disarankan buat placeholder)
RUN mkdir uploads

# Expose port yang digunakan aplikasi
EXPOSE 8081

# Jalankan aplikasi
CMD ["./main"]
