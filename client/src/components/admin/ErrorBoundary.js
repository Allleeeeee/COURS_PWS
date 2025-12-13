import React from "react";
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Произошла ошибка при загрузке карты</div>;
    }
    return this.props.children;
  }
}
export default ErrorBoundary;