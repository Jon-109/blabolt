export interface CheckoutSessionRequest {
  productName: string;
  price: number;
}

export interface CheckoutSessionResponse {
  id: string;
}

export interface ErrorResponse {
  error: string;
}
