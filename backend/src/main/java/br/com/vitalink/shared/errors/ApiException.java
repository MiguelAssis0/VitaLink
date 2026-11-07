package br.com.vitalink.shared.errors;

import org.springframework.http.HttpStatus;
public class ApiException extends RuntimeException {
    public final HttpStatus status; public final String code;
    public ApiException(HttpStatus status, String code, String detail) { super(detail); this.status=status; this.code=code; }
    public static ApiException notFound() { return new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Recurso não encontrado."); }
    public static ApiException forbidden() { return new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Ação não permitida."); }
    public static ApiException conflict(String detail) { return new ApiException(HttpStatus.CONFLICT, "CONFLICT", detail); }
}
