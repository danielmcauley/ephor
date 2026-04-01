import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StateExplorerControls } from "@/components/state-explorer-controls";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace
  })
}));

describe("StateExplorerControls", () => {
  it("updates the selected state and pushes the explorer route", () => {
    render(
      <StateExplorerControls
        jurisdictions={[
          { slug: "california", name: "California", abbr: "CA" },
          { slug: "colorado", name: "Colorado", abbr: "CO" }
        ]}
        selectedSlug="california"
      />
    );

    fireEvent.change(screen.getByLabelText("State"), {
      target: { value: "colorado" }
    });

    expect(screen.getByDisplayValue("Colorado")).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/states?state=colorado", { scroll: false });
  });
});
