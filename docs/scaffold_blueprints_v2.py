import os

base_path = r"d:\FlowBiz\flowbiz-client-amp\docs\Strategic_Plans"

phases = {
    "Phase1_Foundation": [
        "Master_Audit_Checklist",
        "Audit_Scoring_Framework",
        "Data_Asset_Inventory",
        "Competitive_Benchmark_Template",
        "SWOT_Vulnerability_Report",
    ],
    "Phase2_Roadmap": [
        "01_ROI_Based_Upgrade_Priority_Matrix",
        "02_90_Day_Platform_Improvement_Roadmap",
        "03_Weekly_Sprint_Breakdown",
        "04_90_Day_Revenue_Projection_Model",
        "05_Quick_Win_Conversion_Optimization",
    ],
    "Phase3_Market_Expansion": [
        "01_12_Month_Market_Domination_Strategy",
        "02_Competitive_Elimination_Strategy",
        "03_Luxury_Segment_Domination_Plan",
        "04_Luxury_Pricing_Psychology_Strategy",
        "05_Visual_Aesthetic_Premiumization",
        "06_UHNW_Acquisition_Blueprint",
        "07_VIP_Concierge_Protocol",
    ],
    "Phase4_Financial_Modeling": [
        "01_Detailed_12_Month_Financial_Projection",
        "02_Sensitivity_Analysis_Simulator",
        "03_Luxury_Segment_Profit_Simulator",
        "04_12_Month_Revenue_Compounding_Model",
        "05_Interactive_Boardroom_Dashboard",
        "06_Interactive_Decision_Tree_Model",
        "07_Core_KPI_Telemetry_Matrix",
    ],
    "Phase5_Institutional_Growth": [
        "01_Investor_Acquisition_Blueprint",
        "02_3_Year_Expansion_Projection",
        "03_3_Year_Premium_Brand_Equity_Plan",
        "04_Exclusive_Inventory_Acquisition_Strategy",
        "05_Family_Office_Penetration_Strategy",
        "06_Capital_Flow_Funnel_Design",
        "07_Multi_Asset_Expansion_Plan",
        "08_Private_Club_Acquisition_Model",
        "09_Exit_Strategy_Valuation",
    ],
}


def generate_skeleton(title, phase_name):
    clean_title = (
        title.replace("_", " ")
        .replace("01", "")
        .replace("02", "")
        .replace("03", "")
        .replace("04", "")
        .replace("05", "")
        .replace("06", "")
        .replace("07", "")
        .replace("08", "")
        .replace("09", "")
        .strip()
    )
    return f"""# {clean_title}
## Project: AMP Pattaya – Real Estate Intelligence Platform
**Phase Context:** {phase_name.replace("_", " ")}

---

### [AI Agent Prompt / Action Required]
**Objective:** Please generate the full strategic blueprint and architectural logic for this document based on the `Project_Master_Execution_Plan.md`. 
**Tone/Positioning:** Premium, Luxury ($10M+ properties), High-Performing Intelligence Platform.

### 1. Executive Summary
*(AI Agent: Describe the high-level goal, immediate value, and strategic impact of this specific blueprint.)*

### 2. Core Framework & Architecture
*(AI Agent: Detail the steps, metrics, algorithms, models, or operational protocols required to execute this strategy. Use tables, charts, or bullet points for extreme clarity.)*

### 3. Execution Timeline / Sprint Plan
*(AI Agent: Break down how this gets executed on the ground. Granular task level.)*

### 4. Dependencies & Prerequisites
*(AI Agent: List what data, technical infrastructure, or previous documents must be completed before this tier activates.)*

### 5. Expected ROI / Business Impact
*(AI Agent: Forecast the immediate revenue impact, cost savings, or long-term brand equity gained.)*

---
*Created as part of the AMP Pattaya Master Roadmap.*
"""


def main():
    if not os.path.exists(base_path):
        os.makedirs(base_path)

    for phase, files in phases.items():
        phase_dir = os.path.join(base_path, phase)
        if not os.path.exists(phase_dir):
            os.makedirs(phase_dir)

        for file in files:
            # Check if file exists to prevent overwriting content we already created
            file_path = os.path.join(phase_dir, f"{file}.md")
            if not os.path.exists(file_path):
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(generate_skeleton(file, phase))
                print(f"Created Skeleton: {file_path}")
            else:
                print(f"Skipped, already exists: {file_path}")


if __name__ == "__main__":
    main()
