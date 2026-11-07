package br.com.vitalink.shared.errors;

import br.com.vitalink.shared.api.Api;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.time.Instant;
@RestControllerAdvice
public class ApiErrorHandler {
    private static final Logger log = LoggerFactory.getLogger(ApiErrorHandler.class);
    @ExceptionHandler(ApiException.class)
    ResponseEntity<Api.ErrorResponse> domain(ApiException e) {
        return ResponseEntity.status(e.status).body(new Api.ErrorResponse(e.code, e.status.getReasonPhrase(), e.getMessage(), Instant.now()));
    }
    @ExceptionHandler({BadCredentialsException.class, org.springframework.security.authentication.DisabledException.class})
    ResponseEntity<Api.ErrorResponse> authentication(Exception e) {
        return ResponseEntity.status(401).body(new Api.ErrorResponse("UNAUTHORIZED", "Unauthorized", "Email ou senha inválidos.", Instant.now()));
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Api.ErrorResponse> validation(MethodArgumentNotValidException e) {
        String detail = e.getBindingResult().getFieldErrors().stream().findFirst().map(FieldError::getField).map(f -> "Campo inválido: " + f).orElse("Dados inválidos.");
        return ResponseEntity.badRequest().body(new Api.ErrorResponse("VALIDATION_ERROR", "Bad Request", detail, Instant.now()));
    }
    @ExceptionHandler({ObjectOptimisticLockingFailureException.class, DataIntegrityViolationException.class})
    ResponseEntity<Api.ErrorResponse> conflict(Exception e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new Api.ErrorResponse("CONFLICT", "Conflict", "O registro foi alterado por outra operação. Atualize e tente novamente.", Instant.now()));
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<Api.ErrorResponse> unexpected(Exception e, HttpServletRequest request) {
        log.error("Unhandled error for {} {}", request.getMethod(), request.getRequestURI(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new Api.ErrorResponse("INTERNAL_ERROR", "Internal Server Error", "Não foi possível concluir a operação.", Instant.now()));
    }
}
