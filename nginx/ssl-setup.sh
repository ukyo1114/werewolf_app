#!/bin/bash

# Let's Encrypt SSL Setup Script for Werewolf App
# This script sets up SSL certificates using Let's Encrypt

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found. Please copy env.example to .env and configure it."
    exit 1
fi

# Load environment variables
source .env

# Check required environment variables
if [ -z "$DOMAIN_NAME" ] || [ -z "$CERTBOT_EMAIL" ]; then
    print_error "DOMAIN_NAME and CERTBOT_EMAIL must be set in .env file"
    exit 1
fi

print_status "Setting up SSL certificates for domain: $DOMAIN_NAME"

# Function to get SSL certificate
get_ssl_certificate() {
    print_status "Requesting SSL certificate from Let's Encrypt..."
    
    docker-compose -f docker-compose.werewolf.yml run --rm certbot \
        certonly --webroot \
        --webroot-path=/var/www/certbot \
        --email "$CERTBOT_EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN_NAME" \
        -d "www.$DOMAIN_NAME"
    
    if [ $? -eq 0 ]; then
        print_status "SSL certificate obtained successfully!"
    else
        print_error "Failed to obtain SSL certificate"
        exit 1
    fi
}

# Function to renew SSL certificate
renew_ssl_certificate() {
    print_status "Renewing SSL certificate..."
    
    docker-compose -f docker-compose.werewolf.yml run --rm certbot \
        renew --webroot \
        --webroot-path=/var/www/certbot
    
    if [ $? -eq 0 ]; then
        print_status "SSL certificate renewed successfully!"
        # Reload nginx to use new certificate
        docker-compose -f docker-compose.werewolf.yml exec nginx nginx -s reload
    else
        print_error "Failed to renew SSL certificate"
        exit 1
    fi
}

# Function to check certificate status
check_certificate() {
    print_status "Checking certificate status..."
    
    if docker-compose -f docker-compose.werewolf.yml exec nginx test -f "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem"; then
        print_status "SSL certificate exists"
        docker-compose -f docker-compose.werewolf.yml exec nginx openssl x509 -in "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" -text -noout | grep -A 2 "Validity"
    else
        print_warning "SSL certificate not found"
        return 1
    fi
}

# Main script logic
case "${1:-setup}" in
    "setup")
        print_status "Starting SSL setup..."
        
        # Start nginx without SSL first
        print_status "Starting nginx for certificate challenge..."
        docker-compose -f docker-compose.werewolf.yml up -d nginx
        
        # Wait for nginx to be ready
        sleep 10
        
        # Get SSL certificate
        get_ssl_certificate
        
        # Restart nginx with SSL
        print_status "Restarting nginx with SSL configuration..."
        docker-compose -f docker-compose.werewolf.yml restart nginx
        
        print_status "SSL setup completed successfully!"
        ;;
    
    "renew")
        print_status "Starting SSL renewal..."
        renew_ssl_certificate
        ;;
    
    "check")
        check_certificate
        ;;
    
    "status")
        print_status "Checking SSL certificate status..."
        check_certificate
        ;;
    
    *)
        echo "Usage: $0 {setup|renew|check|status}"
        echo "  setup  - Initial SSL certificate setup"
        echo "  renew  - Renew existing SSL certificate"
        echo "  check  - Check certificate status"
        echo "  status - Show certificate information"
        exit 1
        ;;
esac

print_status "SSL operation completed!" 