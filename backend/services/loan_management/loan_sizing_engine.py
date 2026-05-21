"""
Comprehensive Loan Sizing Engine
Combines: Income limits, DTI ratios, Risk adjustments, Expected Loss models
"""

import math
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    VERY_HIGH = "VERY_HIGH"


@dataclass
class LoanSizingResult:
    """Complete loan sizing recommendation"""
    borrower_id: int
    monthly_income: float
    probability_of_default: float
    risk_category: RiskLevel

    # All calculation methods
    income_based_max: float
    dti_based_max: float
    risk_adjusted_max: float
    expected_loss_max: float

    # Recommended offer
    recommended_loan_amount: float
    limiting_factor: str

    # Recommended terms
    recommended_term_days: int
    recommended_interest_rate: float

    # Financial details
    monthly_payment: float
    total_interest: float
    expected_loss: float
    expected_revenue: float

    # Portfolio impact
    portfolio_exposure_pct: float


class LoanSizingEngine:
    """Calculates optimal loan amounts based on multiple factors"""

    # ── Zimbabwe-calibrated configuration ──────────────────────────────────────
    # Source: RBZ Quarterly MFI Reports 2022–2023, ZIMSTAT HBS 2023/24,
    #         EcoCash/Kashagi product data, GetBucks & Stanbic digital-lending tiers

    MAX_INCOME_MULTIPLIER = 2.0   # 2x monthly income — conservative ceiling for
                                  # unsecured alternative-scored loans (Zim market)

    DTI_RATIO = 0.45              # 45% DTI: informal income is net (no PAYE/taxes),
                                  # no hidden formal debts in credit bureau

    LOAN_TERM_MONTHS = 3          # Standard 90-day short-cycle loan (aligns with
                                  # EcoCash Kashagi & Zim MFI norm)

    TARGET_LOSS_TOLERANCE = 0.09  # 9% — RBZ sector PaR: 10.95% (Dec-2022),
                                  # 9.37% (Mar-2023). Using 9% is realistic & prudent.

    LGD = 0.45                    # 45% LGD: mobile-platform-enforced recovery
                                  # (wallet lockout, salary intercept) reduces loss
                                  # severity vs pure unsecured bank loans.

    PORTFOLIO_SIZE = 5000000      # Total portfolio value in USD

    # Risk-adjusted income multipliers (monthly income basis)
    # Calibrated to GetBucks/Stanbic digital-loan tier benchmarks:
    #   LOW → up to 1.2x income  (~USD 1,500–5,000 for mid earners)
    #   MEDIUM → up to 0.8x income
    #   HIGH → up to 0.4x income
    #   VERY_HIGH → nano-loan tier only
    RISK_MULTIPLIERS = {
        "LOW": 1.2,
        "MEDIUM": 0.8,
        "HIGH": 0.4,
        "VERY_HIGH": 0.15,
    }

    # RBZ-aligned absolute caps by risk category (USD)
    # Anchored to: EcoCash Kashagi ($5–50), GetBucks ($100–5,000),
    # Stanbic Digital ($200–2,000), RBZ cash-disbursement ceiling ($250 cash)
    ABSOLUTE_CAPS = {
        "LOW": 5000.0,
        "MEDIUM": 2000.0,
        "HIGH": 750.0,
        "VERY_HIGH": 200.0,
    }

    # Interest rates by risk (annual) — reflect Zim MFI market rates
    RISK_RATES = {
        "LOW": 18.0,
        "MEDIUM": 24.0,
        "HIGH": 36.0,
        "VERY_HIGH": 48.0,
    }

    # Recommended loan terms by risk
    RECOMMENDED_TERMS = {
        "LOW": 90,
        "MEDIUM": 60,
        "HIGH": 30,
        "VERY_HIGH": 14,
    }

    @staticmethod
    def calculate_income_based_limit(monthly_income: float) -> float:
        """
        Income-based limit: Can borrow up to 2x monthly income

        Example: $2,000/month → $4,000 max
        """
        return monthly_income * LoanSizingEngine.MAX_INCOME_MULTIPLIER

    @staticmethod
    def calculate_dti_based_limit(monthly_income: float, existing_debt: float = 0) -> float:
        """
        Debt-to-Income ratio constraint

        Rule: Total monthly debt payments ≤ 35% of income

        For loan payments: monthly_payment = loan_amount / 3 (3-month average)

        Example:
        Income: $2,000
        Existing debt: $200/month
        Available: 2000 * 0.35 = $700
        Available for new loan: $700 - $200 = $500
        Max loan: $500 * 3 = $1,500
        """
        available_for_debt = monthly_income * LoanSizingEngine.DTI_RATIO
        available_for_new_loan = available_for_debt - existing_debt

        # Assume monthly payment = loan_amount / number_of_payments
        max_loan = available_for_new_loan * LoanSizingEngine.LOAN_TERM_MONTHS
        return max(max_loan, 0)

    @staticmethod
    def calculate_risk_adjusted_limit(
        monthly_income: float,
        risk_category: RiskLevel
    ) -> float:
        """
        Risk-adjusted limit based on credit quality

        LOW risk: Can borrow more (5x income)
        MEDIUM risk: Moderate (3x income)
        HIGH risk: Limited (1.5x income)
        VERY_HIGH risk: Minimal (0.5x income)
        """
        # Use the Enum name string for dictionary lookup to avoid cross-module Enum mismatches
        cat_key = risk_category.name if hasattr(risk_category, 'name') else str(risk_category)
        multiplier = LoanSizingEngine.RISK_MULTIPLIERS.get(cat_key, 1.0)
        return monthly_income * multiplier

    @staticmethod
    def calculate_expected_loss_limit(
        monthly_income: float,
        probability_of_default: float,
        existing_exposure: float = 0
    ) -> float:
        """
        Expected Loss model: Limit loans based on acceptable loss tolerance

        Formula:
        Expected Loss per $1 = PD × LGD
        Max loan where total loss stays within target = Available capacity / EL per dollar

        Example:
        PD: 11%, LGD: 50%
        EL per $1: 0.11 × 0.50 = 5.5%

        Income: $2,000
        Available capacity: $2,000 × 0.35 = $700
        Max loan: $700 / (0.055 / 0.02) = $254
        """
        # Calculate expected loss per dollar
        el_per_dollar = probability_of_default * LoanSizingEngine.LGD

        if el_per_dollar == 0:
            el_per_dollar = 0.001  # Avoid division by zero

        # Available debt capacity
        available_capacity = monthly_income * LoanSizingEngine.DTI_RATIO

        # Maximum loan where loss stays within tolerance
        max_loan = (available_capacity / LoanSizingEngine.LOAN_TERM_MONTHS) / (
            el_per_dollar / LoanSizingEngine.TARGET_LOSS_TOLERANCE
        )

        return max(max_loan, 0)

    @staticmethod
    def calculate_monthly_payment(loan_amount: float, annual_rate: float, term_days: int) -> float:
        """
        Calculate monthly payment using amortization formula

        Formula: P = [r(PV)] / [1 - (1 + r)^-n]
        where:
        - P = payment
        - r = monthly interest rate
        - PV = loan amount
        - n = number of payments
        """
        if loan_amount == 0:
            return 0

        term_months = term_days / 30
        monthly_rate = (annual_rate / 100) / 12

        if monthly_rate == 0:
            return loan_amount / term_months

        num_payments = term_months
        payment = (monthly_rate * loan_amount) / (1 - (1 + monthly_rate) ** -num_payments)

        return payment

    @staticmethod
    def calculate_total_interest(loan_amount: float, annual_rate: float, term_days: int) -> float:
        """Calculate total interest paid over loan term"""
        term_months = term_days / 30
        monthly_payment = LoanSizingEngine.calculate_monthly_payment(
            loan_amount, annual_rate, term_days
        )
        total_repayment = monthly_payment * term_months
        return max(total_repayment - loan_amount, 0)

    @staticmethod
    def get_recommended_term(risk_category: RiskLevel) -> int:
        """Get recommended loan term based on risk"""
        cat_key = risk_category.name if hasattr(risk_category, 'name') else str(risk_category)
        return LoanSizingEngine.RECOMMENDED_TERMS.get(cat_key, 90)

    @staticmethod
    def get_recommended_rate(risk_category: RiskLevel) -> float:
        """Get recommended interest rate based on risk"""
        cat_key = risk_category.name if hasattr(risk_category, 'name') else str(risk_category)
        return LoanSizingEngine.RISK_RATES.get(cat_key, 18.0)

    @classmethod
    def calculate_optimal_loan(
        cls,
        borrower_id: int,
        monthly_income: float,
        probability_of_default: float,
        risk_category: RiskLevel,
        existing_exposure: float = 0,
        existing_debt: float = 0,
    ) -> LoanSizingResult:
        """
        Calculate optimal loan amount combining ALL constraints

        Returns the MINIMUM of all limits (most conservative)
        This ensures the loan stays within ALL constraints
        """

        # Calculate all limits
        income_limit = cls.calculate_income_based_limit(monthly_income)
        dti_limit = cls.calculate_dti_based_limit(monthly_income, existing_debt)
        risk_limit = cls.calculate_risk_adjusted_limit(monthly_income, risk_category)
        el_limit = cls.calculate_expected_loss_limit(monthly_income, probability_of_default, existing_exposure)

        # Get the minimum (most restrictive)
        all_limits = {
            "income": income_limit,
            "dti": dti_limit,
            "risk": risk_limit,
            "expected_loss": el_limit,
        }

        recommended_amount = min(all_limits.values())
        limiting_factor = min(all_limits, key=all_limits.get)

        # Apply RBZ-aligned absolute cap for this risk category
        # Ensures the final offer never exceeds the market/regulatory ceiling
        cat_key = risk_category.name if hasattr(risk_category, 'name') else str(risk_category)
        absolute_cap = cls.ABSOLUTE_CAPS.get(cat_key, 2000.0)
        if recommended_amount > absolute_cap:
            recommended_amount = absolute_cap
            limiting_factor = "absolute_cap"

        # Get terms based on risk
        term_days = cls.get_recommended_term(risk_category)
        annual_rate = cls.get_recommended_rate(risk_category)

        # Calculate financial details
        monthly_payment = cls.calculate_monthly_payment(recommended_amount, annual_rate, term_days)
        total_interest = cls.calculate_total_interest(recommended_amount, annual_rate, term_days)
        expected_loss = recommended_amount * probability_of_default * cls.LGD
        expected_revenue = total_interest - expected_loss

        # Portfolio impact
        portfolio_exposure_pct = (recommended_amount / cls.PORTFOLIO_SIZE) * 100

        return LoanSizingResult(
            borrower_id=borrower_id,
            monthly_income=monthly_income,
            probability_of_default=probability_of_default,
            risk_category=risk_category,
            income_based_max=income_limit,
            dti_based_max=dti_limit,
            risk_adjusted_max=risk_limit,
            expected_loss_max=el_limit,
            recommended_loan_amount=recommended_amount,
            limiting_factor=limiting_factor,
            recommended_term_days=term_days,
            recommended_interest_rate=annual_rate,
            monthly_payment=monthly_payment,
            total_interest=total_interest,
            expected_loss=expected_loss,
            expected_revenue=expected_revenue,
            portfolio_exposure_pct=portfolio_exposure_pct,
        )
