# Frontend Error Handling Patterns

**Version**: 1.0
**Date**: 2025-12-09
**Purpose**: Error handling and validation strategies for robust UIs

---

## 1. WebSocket Error Handling

### 1.1 Timeout Handling

```typescript
private async _callWSWithTimeout<T>(
  message: any,
  timeout = 5000
): Promise<T> {
  return Promise.race([
    this.hass.callWS<T>(message),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
}

// Usage
try {
  const result = await this._callWSWithTimeout({
    type: 'home_topology/locations/update',
    location_id: 'kitchen',
    changes: { name: 'New Kitchen' }
  }, 3000);
} catch (error) {
  if (error.message === 'Request timeout') {
    this._showError('Request timed out. Please try again.');
  }
}
```

---

### 1.2 Network Error Recovery

```typescript
private async _retryWSCall<T>(
  message: any,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await this.hass.callWS<T>(message);
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

### 1.3 Retry Strategies

```typescript
interface RetryOptions {
  maxRetries: number;
  backoff: "linear" | "exponential";
  initialDelay: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

async function retryWithStrategy<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxRetries,
    backoff,
    initialDelay,
    maxDelay = 30000,
    onRetry,
  } = options;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      let delay = initialDelay;
      if (backoff === "exponential") {
        delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      } else {
        delay = Math.min(initialDelay * (attempt + 1), maxDelay);
      }

      if (onRetry) {
        onRetry(attempt + 1, error as Error);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Unreachable");
}

// Usage
try {
  const result = await retryWithStrategy(
    () => this.hass.callWS({ type: "home_topology/locations/list" }),
    {
      maxRetries: 3,
      backoff: "exponential",
      initialDelay: 1000,
      onRetry: (attempt, error) => {
        console.log(`Retry attempt ${attempt}: ${error.message}`);
        this._showToast(`Retrying... (attempt ${attempt})`, "warning");
      },
    }
  );
} catch (error) {
  this._showError("Failed after multiple attempts");
}
```

---

## 2. Validation Errors

### 2.1 Client-Side Validation Before WebSocket Call

```typescript
interface ValidationResult {
  valid: boolean;
  errors: Map<string, string>;
}

private _validateLocation(location: Partial<Location>): ValidationResult {
  const errors = new Map<string, string>();

  // Required fields
  if (!location.name || location.name.trim() === '') {
    errors.set('name', 'Name is required');
  }

  // Length validation
  if (location.name && location.name.length > 100) {
    errors.set('name', 'Name must be 100 characters or less');
  }

  // Pattern validation
  if (location.name && !/^[a-zA-Z0-9\s\-_]+$/.test(location.name)) {
    errors.set('name', 'Name can only contain letters, numbers, spaces, hyphens, and underscores');
  }

  // Business logic validation
  if (location.parent_id === location.id) {
    errors.set('parent_id', 'Location cannot be its own parent');
  }

  return {
    valid: errors.size === 0,
    errors
  };
}

private async _handleSubmit() {
  const validation = this._validateLocation(this._config);

  if (!validation.valid) {
    this._validationErrors = validation.errors;
    this._showError('Please fix validation errors');
    return;
  }

  try {
    await this.hass.callWS({
      type: 'home_topology/locations/create',
      ...this._config
    });
  } catch (error) {
    this._handleServerError(error);
  }
}
```

---

### 2.2 Server-Side Error Display

```typescript
interface ServerError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

private _handleServerError(error: any) {
  const serverError = error as ServerError;

  // Map server error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    'invalid_hierarchy': 'Cannot place a room inside a zone',
    'duplicate_name': 'A location with this name already exists',
    'not_found': 'Location not found. It may have been deleted.',
    'permission_denied': 'You do not have permission to perform this action',
    'invalid_parent': 'Invalid parent location',
  };

  const userMessage = errorMessages[serverError.code] || serverError.message;
  this._showError(userMessage);

  // If server provides field-specific errors
  if (serverError.details) {
    Object.entries(serverError.details).forEach(([field, message]) => {
      this._validationErrors.set(field, message);
    });
  }
}
```

---

### 2.3 Field-Level Error Messages

```typescript
render() {
  return html`
    <ha-textfield
      label="Name"
      .value=${this._config.name}
      .errorMessage=${this._validationErrors.get('name')}
      .invalid=${this._validationErrors.has('name')}
      @input=${this._handleNameInput}
      @blur=${this._validateField.bind(this, 'name')}
    ></ha-textfield>

    <ha-textfield
      label="Timeout (minutes)"
      type="number"
      .value=${this._config.timeout?.toString()}
      .errorMessage=${this._validationErrors.get('timeout')}
      .invalid=${this._validationErrors.has('timeout')}
      @input=${this._handleTimeoutInput}
      @blur=${this._validateField.bind(this, 'timeout')}
    ></ha-textfield>
  `;
}

private _validateField(fieldName: string) {
  // Clear previous error
  this._validationErrors.delete(fieldName);

  // Validate specific field
  switch (fieldName) {
    case 'name':
      if (!this._config.name) {
        this._validationErrors.set('name', 'Name is required');
      }
      break;
    case 'timeout':
      if (this._config.timeout !== undefined && this._config.timeout < 0) {
        this._validationErrors.set('timeout', 'Timeout must be positive');
      }
      break;
  }

  // Trigger re-render
  this.requestUpdate();
}
```

---

## 3. User Feedback

### 3.1 Toast Notifications

```typescript
interface ToastOptions {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

private _showToast(options: ToastOptions) {
  // Using HA's toast system (when available)
  const toast = document.createElement('ha-toast');
  toast.message = options.message;
  toast.duration = options.duration || 3000;

  // Style based on type
  const styles: Record<string, string> = {
    success: 'background-color: var(--success-color);',
    error: 'background-color: var(--error-color);',
    warning: 'background-color: var(--warning-color);',
    info: 'background-color: var(--info-color);'
  };

  toast.setAttribute('style', styles[options.type]);

  if (options.action) {
    const button = document.createElement('mwc-button');
    button.label = options.action.label;
    button.addEventListener('click', options.action.handler);
    toast.appendChild(button);
  }

  document.body.appendChild(toast);
  toast.show();
}

// Usage examples
this._showToast({
  message: 'Location saved successfully',
  type: 'success'
});

this._showToast({
  message: 'Failed to save location',
  type: 'error',
  duration: 5000,
  action: {
    label: 'Retry',
    handler: () => this._handleSubmit()
  }
});
```

---

### 3.2 Inline Error Messages

```typescript
render() {
  return html`
    <div class="form-section">
      <h3>Location Details</h3>

      ${this._error ? html`
        <div class="error-banner">
          <ha-icon icon="mdi:alert-circle"></ha-icon>
          <span>${this._error}</span>
          ${this._canRetry ? html`
            <mwc-button @click=${this._handleRetry}>Retry</mwc-button>
          ` : ''}
        </div>
      ` : ''}

      <!-- Form fields -->
    </div>
  `;
}

static styles = css`
  .error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: rgba(var(--rgb-error-color), 0.1);
    border-left: 4px solid var(--error-color);
    border-radius: 4px;
    margin-bottom: 16px;
  }

  .error-banner ha-icon {
    color: var(--error-color);
  }
`;
```

---

### 3.3 Loading States

```typescript
@state() private _loading = false;
@state() private _loadingMessage = '';

private async _loadLocations() {
  this._loading = true;
  this._loadingMessage = 'Loading locations...';

  try {
    const result = await this.hass.callWS({
      type: 'home_topology/locations/list'
    });
    this._locations = result.locations;
  } catch (error) {
    this._error = 'Failed to load locations';
  } finally {
    this._loading = false;
    this._loadingMessage = '';
  }
}

render() {
  if (this._loading) {
    return html`
      <div class="loading-overlay">
        <ha-circular-progress indeterminate></ha-circular-progress>
        <div class="loading-message">${this._loadingMessage}</div>
      </div>
    `;
  }

  // Normal content
}
```

---

## 4. Graceful Degradation

### 4.1 Fallback UI When Data Unavailable

```typescript
render() {
  // Data not loaded yet
  if (!this.location) {
    return html`
      <div class="empty-state">
        <div class="empty-icon">📍</div>
        <div class="empty-message">Select a location to view details</div>
      </div>
    `;
  }

  // Data load failed
  if (this._error) {
    return html`
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <div class="error-message">${this._error}</div>
        <mwc-button @click=${this._handleRetry}>Retry</mwc-button>
      </div>
    `;
  }

  // Partial data available (some entities missing)
  const availableEntities = this.location.entity_ids.filter(id =>
    this.hass.states[id] !== undefined
  );

  const missingCount = this.location.entity_ids.length - availableEntities.length;

  return html`
    <div>
      ${missingCount > 0 ? html`
        <div class="warning-banner">
          ${missingCount} entity(ies) not found in Home Assistant
        </div>
      ` : ''}

      <!-- Display available entities -->
      ${availableEntities.map(id => this._renderEntity(id))}
    </div>
  `;
}
```

---

### 4.2 Empty States

```typescript
render() {
  if (this.locations.length === 0) {
    if (this._loading) {
      return html`<div class="loading">Loading...</div>`;
    }

    return html`
      <div class="empty-state">
        <div class="empty-icon">🏠</div>
        <h3>No Locations Yet</h3>
        <p>Create your first location to get started</p>
        <mwc-button raised @click=${this._handleCreate}>
          Create Location
        </mwc-button>
      </div>
    `;
  }

  // List rendering
}

static styles = css`
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
  }

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-state h3 {
    margin: 0 0 8px 0;
    color: var(--primary-text-color);
  }

  .empty-state p {
    margin: 0 0 24px 0;
    color: var(--secondary-text-color);
  }
`;
```

---

### 4.3 Partial Failure Handling (Batch Operations)

```typescript
private async _saveBatchChanges() {
  this._saving = true;
  const changes = Array.from(this._pendingChanges.entries());

  const results = await Promise.allSettled(
    changes.map(([id, change]) => this._saveOne(id, change))
  );

  // Analyze results
  const successful: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  results.forEach((result, idx) => {
    const [id] = changes[idx];
    if (result.status === 'fulfilled') {
      successful.push(id);
      this._pendingChanges.delete(id);
    } else {
      failed.push({
        id,
        error: result.reason.message
      });
    }
  });

  this._saving = false;

  // Show appropriate feedback
  if (failed.length === 0) {
    this._showToast({
      message: `Successfully saved ${successful.length} change(s)`,
      type: 'success'
    });
  } else if (successful.length === 0) {
    this._showToast({
      message: 'All changes failed to save',
      type: 'error'
    });
    this._showFailureDetails(failed);
  } else {
    this._showToast({
      message: `Saved ${successful.length}, failed ${failed.length}`,
      type: 'warning',
      duration: 5000
    });
    this._showFailureDetails(failed);
  }
}

private _showFailureDetails(failures: Array<{ id: string; error: string }>) {
  this._failureDetails = html`
    <div class="failure-list">
      <h4>Failed to save:</h4>
      <ul>
        ${failures.map(f => html`
          <li>
            <strong>${this._getLocationName(f.id)}</strong>: ${f.error}
          </li>
        `)}
      </ul>
    </div>
  `;
}
```

---

## 5. Error Boundaries

### 5.1 Component-Level Error Catching

```typescript
export class HtLocationTree extends LitElement {
  @state() private _renderError?: Error;

  render() {
    if (this._renderError) {
      return this._renderErrorFallback();
    }

    try {
      return this._renderContent();
    } catch (error) {
      this._renderError = error as Error;
      console.error("Render error in LocationTree:", error);
      return this._renderErrorFallback();
    }
  }

  private _renderErrorFallback() {
    return html`
      <div class="component-error">
        <h3>Something went wrong</h3>
        <p>The location tree encountered an error.</p>
        <details>
          <summary>Error details</summary>
          <pre>${this._renderError?.stack}</pre>
        </details>
        <mwc-button @click=${this._handleReset}>Reset</mwc-button>
      </div>
    `;
  }

  private _handleReset() {
    this._renderError = undefined;
    this._locations = [];
    this.requestUpdate();
  }
}
```

---

## 6. Debugging Aids

### 6.1 Debug Mode Logging

```typescript
export class HomeTopologyPanel extends LitElement {
  private DEBUG = window.location.search.includes("debug=true");

  private _log(level: "info" | "warn" | "error", ...args: any[]) {
    if (this.DEBUG) {
      console[level]("[HomeTopology]", ...args);
    }
  }

  private async _loadLocations() {
    this._log("info", "Loading locations...");
    try {
      const result = await this.hass.callWS({
        type: "home_topology/locations/list",
      });
      this._log("info", "Loaded", result.locations.length, "locations");
      this._locations = result.locations;
    } catch (error) {
      this._log("error", "Failed to load locations:", error);
      throw error;
    }
  }
}

// Enable with: http://localhost:8123/home-topology?debug=true
```

---

### 6.2 Error Reporting Service

```typescript
interface ErrorReport {
  timestamp: string;
  component: string;
  error: Error;
  context?: Record<string, any>;
  userAgent: string;
}

class ErrorReporter {
  private static reports: ErrorReport[] = [];

  static report(
    component: string,
    error: Error,
    context?: Record<string, any>
  ) {
    const report: ErrorReport = {
      timestamp: new Date().toISOString(),
      component,
      error,
      context,
      userAgent: navigator.userAgent,
    };

    this.reports.push(report);
    console.error(`[${component}]`, error, context);

    // Optional: Send to monitoring service
    // this.sendToMonitoring(report);
  }

  static getReports(): ErrorReport[] {
    return [...this.reports];
  }

  static clear() {
    this.reports = [];
  }
}

// Usage
try {
  await this.hass.callWS({ type: "home_topology/locations/create", ...data });
} catch (error) {
  ErrorReporter.report("HomeTopologyPanel", error as Error, {
    action: "create_location",
    data,
  });
  throw error;
}
```

---

**Document Status**: Active
**Last Updated**: 2025-12-09
**Maintainer**: Mike
**Related Docs**: `frontend-patterns.md`, `frontend-testing-patterns.md`, `frontend-state-management.md`
