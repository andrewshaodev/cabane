import { Component, type ReactNode } from "react";

/** A failed hosted texture must not take down the home or its controls. */
export class WeatherCloudAssetBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}
