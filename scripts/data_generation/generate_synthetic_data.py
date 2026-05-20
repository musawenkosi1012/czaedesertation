import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

rng = np.random.default_rng(42)

# ── Name pools ──────────────────────────────────────────────────────────────
shona_first   = ["Tinashe","Farai","Simba","Tendai","Nyasha","Rumbidzai","Tafadzwa","Munashe","Anesu","Kumbirayi","Tatenda","Ruvimbo","Chengetai","Kudzai","Mufaro"]
shona_last    = ["Moyo","Chimutengwende","Mushore","Gumbo","Zhou","Chidzero","Murerwa","Mutasa","Makoni","Chirau","Zimunya","Chikore","Marere","Chigumba","Madzore"]
ndebele_first = ["Thabani","Sipho","Gugulethu","Nomsa","Bongani","Dumisani","Khanyile","Mpofu","Sikhanyiso","Zibusiso","Mthokozisi","Nqobizitha","Lindiwe","Sibusiso","Thembekile"]
ndebele_last  = ["Ndlovu","Dube","Khumalo","Mpofu","Nyathi","Ncube","Nkomo","Mlilo","Bhebhe","Tshuma","Hlabangana","Khumalo","Moyo","Sibanda","Mahlangu"]
english_first = ["James","John","Mary","Elizabeth","William","Robert","Patricia","Michael","Linda","David","Richard","Susan","Joseph","Thomas","Sarah"]
english_last  = ["Smith","Jones","Taylor","Williams","Brown","Wilson","Evans","Roberts","Thomas","Walker","Johnson","Lewis","Robinson","Clarke","Wright"]

def get_name():
    t = rng.choice(["shona", "ndebele", "english"])
    if t == "shona":   return f"{rng.choice(shona_first)} {rng.choice(shona_last)}"
    if t == "ndebele": return f"{rng.choice(ndebele_first)} {rng.choice(ndebele_last)}"
    return f"{rng.choice(english_first)} {rng.choice(english_last)}"


# ── Persona definitions ──────────────────────────────────────────────────────
# Each persona drives: income tier, payment behaviour, default rate, temporal patterns.
# Default label is assigned AFTER payment features — behaviour-first.
PERSONAS = [
    # (name,                         share, income_tier, payment_profile, base_default_rate)
    ("formal_disciplined",           0.25,  "high",       "excellent",    0.05),
    ("formal_poor_payer",            0.08,  "high",       "poor",         0.40),  # the missing persona
    ("informal_disciplined",         0.20,  "medium",     "good",         0.15),
    ("seasonal_worker",              0.15,  "irregular",  "mixed",        0.30),
    ("gig_peri_urban",               0.12,  "low",        "mixed",        0.35),
    ("recovering_defaulter",         0.10,  "medium",     "improving",    0.25),
    ("standard_middle",              0.10,  "medium",     "average",      0.20),
]


# ── Province definitions ─────────────────────────────────────────────────────
PROVINCES = {
    "Harare":        {"tier": "high",   "risk_adj": 0.85, "urban_pct": 0.95},
    "Bulawayo":      {"tier": "high",   "risk_adj": 0.87, "urban_pct": 0.90},
    "Masvingo":      {"tier": "medium", "risk_adj": 1.00, "urban_pct": 0.45},
    "Mutare":        {"tier": "medium", "risk_adj": 1.00, "urban_pct": 0.50},
    "Gweru":         {"tier": "medium", "risk_adj": 1.00, "urban_pct": 0.55},
    "Chinhoyi":      {"tier": "medium", "risk_adj": 1.00, "urban_pct": 0.48},
    "Binga":         {"tier": "low",    "risk_adj": 1.25, "urban_pct": 0.15},
    "Chikomba":      {"tier": "low",    "risk_adj": 1.25, "urban_pct": 0.20},
    "Hwange":        {"tier": "low",    "risk_adj": 1.25, "urban_pct": 0.25},
    "Beit Bridge":   {"tier": "low",    "risk_adj": 1.25, "urban_pct": 0.30},
}

PROVINCE_NAMES   = list(PROVINCES.keys())
PROVINCE_WEIGHTS = np.array([0.20, 0.12, 0.10, 0.10, 0.09, 0.08, 0.07, 0.08, 0.08, 0.08])

def assign_provinces(n):
    w = PROVINCE_WEIGHTS / PROVINCE_WEIGHTS.sum()
    return rng.choice(PROVINCE_NAMES, size=n, p=w)

def province_risk_index(province_arr):
    lookup = {p: PROVINCES[p]["risk_adj"] for p in PROVINCE_NAMES}
    return np.array([lookup[p] for p in province_arr])

def income_seasonality_index(employment_arr, n):
    result = np.ones(n)
    for i, emp in enumerate(employment_arr):
        if emp == "Informal":
            result[i] = rng.uniform(1.5, 3.5)
        elif emp == "Self-employed":
            result[i] = rng.uniform(1.2, 2.5)
        else:
            result[i] = rng.uniform(1.05, 1.25)
    return result


def new_features_for_persona(profile, income, employment, n):
    """Generate 8 new synthetic features per persona group."""
    # savings_retention_rate
    if profile in ("excellent", "good"):
        savings = np.clip(rng.beta(6, 3, n), 0.10, 0.60)
    elif profile == "poor":
        savings = np.clip(rng.beta(2, 8, n), 0.00, 0.20)
    else:
        savings = np.clip(rng.beta(4, 5, n), 0.05, 0.40)

    # bill_type_diversity (1-5)
    inc_norm = np.clip(income / 2200, 0, 1)
    bill_div = np.clip(np.round(1 + 4 * inc_norm + rng.normal(0, 0.5, n)).astype(int), 1, 5)

    # merchant_to_p2p_ratio
    is_formal = (employment == "Formal")
    merchant_p2p = np.where(is_formal, rng.uniform(0.4, 1.2, n), rng.uniform(0.1, 0.6, n))
    merchant_p2p = np.clip(merchant_p2p, 0.05, 2.0)

    # large_tx_frequency
    if profile in ("excellent", "good"):
        large_tx = np.clip(np.round(rng.uniform(0, 2, n)).astype(int), 0, 5)
    elif profile == "poor":
        large_tx = np.clip(np.round(rng.uniform(1, 5, n)).astype(int), 0, 8)
    else:
        large_tx = np.clip(np.round(rng.uniform(0, 3, n)).astype(int), 0, 8)

    # night_tx_ratio
    if profile in ("excellent", "good"):
        night = np.clip(rng.beta(2, 8, n), 0.0, 0.30)
    else:
        night = np.clip(rng.beta(4, 6, n), 0.05, 0.50)

    # prior_loan_count
    prior_loans = np.clip(np.round(rng.uniform(0, 4, n)).astype(int), 0, 5)

    # debt_to_income_ratio
    if profile == "poor":
        dti = np.clip(rng.uniform(0.5, 3.5, n), 0, 5)
    elif profile in ("excellent", "good"):
        dti = np.clip(rng.uniform(0.0, 1.2, n), 0, 5)
    else:
        dti = np.clip(rng.uniform(0.2, 2.0, n), 0, 5)

    # recipient_diversity
    rec_div = np.clip(np.round(rng.uniform(2, 15, n) * (inc_norm + 0.3)).astype(int), 1, 20)

    return (savings, bill_div, merchant_p2p, large_tx, night, prior_loans, dti, rec_div)


def assign_personas(n):
    """Return array of persona names for n borrowers based on PERSONAS shares."""
    names   = [p[0] for p in PERSONAS]
    weights = np.array([p[1] for p in PERSONAS])
    weights = weights / weights.sum()
    return rng.choice(names, size=n, p=weights)


def income_for_tier(tier, n):
    """Generate monthly income (ZWL) matching Zimbabwe PICES distribution."""
    if tier == "high":
        return rng.uniform(700, 2200, n)
    if tier == "medium":
        return rng.uniform(200, 700, n)
    if tier == "low":
        return rng.uniform(60, 250, n)
    # irregular — seasonal: alternates feast/famine
    base = rng.uniform(100, 500, n)
    shock = rng.choice([0.4, 0.6, 0.8, 1.0, 1.2, 1.5], size=n)
    return base * shock


def payment_features_for_profile(profile, n):
    """
    Generate payment behaviour features independently of income.
    Returns: pct_bills_on_time, avg_days_late, repeat_lateness_count
    """
    if profile == "excellent":
        pct   = np.clip(rng.beta(12, 2, n), 0.80, 1.00)
        late  = np.clip(rng.exponential(0.5, n), 0, 3)
        rep   = np.clip(np.round(rng.uniform(0, 1, n)).astype(int), 0, 8)

    elif profile == "poor":
        # Chronic late payer — high income, still pays late
        pct   = np.clip(rng.beta(2, 7, n), 0.00, 0.50)
        late  = np.clip(rng.exponential(12, n), 3, 20)
        rep   = np.clip(np.round(rng.uniform(4, 8, n)).astype(int), 0, 8)

    elif profile == "good":
        pct   = np.clip(rng.beta(9, 2, n), 0.60, 1.00)
        late  = np.clip(rng.exponential(1.5, n), 0, 6)
        rep   = np.clip(np.round(rng.uniform(0, 2, n)).astype(int), 0, 8)

    elif profile == "mixed":
        pct   = np.clip(rng.beta(5, 5, n), 0.30, 0.80)
        late  = np.clip(rng.exponential(5, n), 0, 15)
        rep   = np.clip(np.round(rng.uniform(1, 5, n)).astype(int), 0, 8)

    elif profile == "improving":
        # Was bad, getting better — medium payment stats
        pct   = np.clip(rng.beta(6, 4, n), 0.40, 0.80)
        late  = np.clip(rng.exponential(3, n), 0, 12)
        rep   = np.clip(np.round(rng.uniform(1, 4, n)).astype(int), 0, 8)

    else:  # average
        pct   = np.clip(rng.beta(7, 4, n), 0.45, 0.90)
        late  = np.clip(rng.exponential(2.5, n), 0, 10)
        rep   = np.clip(np.round(rng.uniform(0, 3, n)).astype(int), 0, 8)

    return pct, late, rep


def payment_discipline_score(pct, avg_late, repeat_late):
    """
    Composite payment behaviour signal (0–100).
    Higher = more disciplined payer.
    Weights: on-time rate (50%), lateness severity (30%), repeat offences (20%).
    """
    avg_late_norm  = np.clip(avg_late / 20.0, 0, 1)
    repeat_norm    = np.clip(repeat_late / 8.0, 0, 1)
    score = (pct * 0.5 + (1 - avg_late_norm) * 0.3 + (1 - repeat_norm) * 0.2) * 100
    return np.clip(score, 0, 100)


def default_label_behaviour_first(pds_score, income, income_tier, base_rate, location=None):
    """
    Assign default probability with payment behaviour as primary driver.

    Formula:
      payment_pd      = 1 - (payment_discipline_score / 100)
      income_factor   = 0.70 (high) | 0.90 (medium/irregular) | 1.20 (low)
      location_factor = 1.35 (Rural) | 1.00 (Urban)   [dissertation p<0.001]
      base_pd         = clip(payment_pd x income_factor x location_factor x scale)

    Income reduces risk but cannot override chronic bad payment behaviour.
    Rural borrowers face a 35% higher default probability (access, infrastructure).
    """
    payment_pd = 1.0 - (pds_score / 100.0)

    income_factor = np.where(
        income_tier == "high",   0.70,
        np.where(income_tier == "low", 1.20, 0.90)
    )

    location_factor = np.ones(len(pds_score))
    if location is not None:
        location_factor = np.where(location == "Rural", 1.35, 1.00)

    raw_pd   = payment_pd * income_factor * location_factor
    mean_raw = raw_pd.mean()
    scale    = base_rate / (mean_raw + 1e-9)
    pd_final = np.clip(raw_pd * scale, 0, 1)
    return (rng.random(len(pds_score)) < pd_final).astype(int)


def generate_data(num_borrowers=50000):
    print(f"Generating synthetic data for {num_borrowers} borrowers...")
    n = num_borrowers

    # ── Demographics ─────────────────────────────────────────────────────────
    ages      = rng.integers(18, 66, n)
    locations = rng.choice(["Urban", "Rural"], size=n, p=[0.6, 0.4])
    emp_rand  = rng.random(n)
    employment = np.where(emp_rand < 0.30, "Formal",
                 np.where(emp_rand < 0.70, "Informal", "Self-employed"))

    # ── Assign personas ───────────────────────────────────────────────────────
    persona_map = {p[0]: p for p in PERSONAS}
    persona_names = assign_personas(n)

    # ── Province and seasonal arrays
    provinces            = assign_provinces(n)
    prov_risk_idx        = province_risk_index(provinces)
    income_seas_idx      = income_seasonality_index(employment, n)

    # New feature arrays
    savings_retention    = np.zeros(n)
    bill_type_div        = np.zeros(n, dtype=int)
    merchant_p2p         = np.zeros(n)
    large_tx_freq        = np.zeros(n, dtype=int)
    night_tx_rat         = np.zeros(n)
    prior_loan_cnt       = np.zeros(n, dtype=int)
    debt_to_income       = np.zeros(n)
    recipient_div        = np.zeros(n, dtype=int)

    # Arrays to fill
    monthly_income         = np.zeros(n)
    income_tier_arr        = np.empty(n, dtype=object)
    pct_bills_on_time      = np.zeros(n)
    avg_days_late          = np.zeros(n)
    repeat_lateness_count  = np.zeros(n)
    pds                    = np.zeros(n)
    default                = np.zeros(n, dtype=int)
    income_stability       = np.zeros(n)
    income_growth          = np.zeros(n)
    monthly_tx_count       = np.zeros(n)
    tx_consistency         = np.zeros(n)
    activity_trend         = np.zeros(n)
    device_stability       = np.zeros(n)

    for pname, (_, share, tier, profile, base_dr) in persona_map.items():
        mask = persona_names == pname
        k    = mask.sum()
        if k == 0:
            continue

        income_tier_arr[mask] = tier

        # Income — independent of payment behaviour
        inc = income_for_tier(tier, k)
        # Rural borrowers skew 15% lower
        rural_mask_local = locations[mask] == "Rural"
        inc[rural_mask_local] *= rng.uniform(0.80, 0.90, rural_mask_local.sum())
        monthly_income[mask] = np.clip(inc, 30, 2500)

        # Payment features — driven by persona profile, NOT income
        pct, late, rep = payment_features_for_profile(profile, k)
        pct_bills_on_time[mask]     = pct
        avg_days_late[mask]         = late
        repeat_lateness_count[mask] = rep

        # Composite payment discipline score
        pds_k = payment_discipline_score(pct, late, rep)
        pds[mask] = pds_k

        # Default label — behaviour first, income + location adjust
        # Province-adjusted default rate
        prov_adj    = prov_risk_idx[mask]
        adj_base_dr = float(np.clip(base_dr * prov_adj.mean(), 0.02, 0.70))
        default[mask] = default_label_behaviour_first(
            pds_k, inc, tier, adj_base_dr, location=locations[mask]
        )

        # New features for this persona
        (savings_retention[mask], bill_type_div[mask], merchant_p2p[mask],
         large_tx_freq[mask], night_tx_rat[mask],
         prior_loan_cnt[mask], debt_to_income[mask],
         recipient_div[mask]) = new_features_for_persona(
            profile, monthly_income[mask], employment[mask], k
        )

        # ── Income-related features ──────────────────────────────────────────
        # Stability: high-discipline payers tend to have stable income too,
        # but "formal_poor_payer" breaks that pattern (high income, unstable habits)
        if profile in ("excellent", "good"):
            income_stability[mask] = np.clip(rng.beta(8, 3, k), 0.45, 1.00)
            income_growth[mask]    = np.clip(rng.normal(0.06, 0.06, k), -0.2, 0.5)
        elif profile == "poor":
            # High income but unstable — lifestyle spending
            income_stability[mask] = np.clip(rng.beta(5, 4, k), 0.30, 0.75)
            income_growth[mask]    = np.clip(rng.normal(0.02, 0.08, k), -0.3, 0.3)
        elif profile == "improving":
            income_stability[mask] = np.clip(rng.beta(6, 4, k), 0.35, 0.80)
            income_growth[mask]    = np.clip(rng.normal(0.04, 0.07, k), -0.2, 0.4)
        else:  # mixed, average, irregular
            income_stability[mask] = np.clip(rng.beta(4, 5, k), 0.20, 0.75)
            income_growth[mask]    = np.clip(rng.normal(0.00, 0.10, k), -0.4, 0.4)

        # ── Transaction features ──────────────────────────────────────────────
        # High-income poor payers still transact a lot — just don't pay bills
        if tier == "high":
            monthly_tx_count[mask] = np.clip(rng.uniform(20, 70, k), 1, 100)
        elif tier == "low":
            monthly_tx_count[mask] = np.clip(rng.uniform(3, 20, k), 1, 100)
        else:
            monthly_tx_count[mask] = np.clip(rng.uniform(8, 40, k), 1, 100)

        if profile in ("excellent", "good"):
            tx_consistency[mask]  = np.clip(rng.beta(8, 3, k), 0.45, 1.00)
            activity_trend[mask]  = np.clip(rng.normal(0.08, 0.10, k), -0.3, 1.0)
            device_stability[mask]= np.clip(rng.beta(8, 3, k), 0.50, 1.00)
        elif profile == "poor":
            # Consistent activity but poor payment — they USE mobile money, just don't pay bills
            tx_consistency[mask]  = np.clip(rng.beta(7, 3, k), 0.40, 0.95)
            activity_trend[mask]  = np.clip(rng.normal(0.05, 0.10, k), -0.2, 0.8)
            device_stability[mask]= np.clip(rng.beta(7, 3, k), 0.45, 0.95)
        else:
            tx_consistency[mask]  = np.clip(rng.beta(5, 5, k), 0.20, 0.85)
            activity_trend[mask]  = np.clip(rng.normal(0.00, 0.15, k), -0.8, 0.8)
            device_stability[mask]= np.clip(rng.beta(5, 4, k), 0.30, 0.90)

    # ── Soft conditioning: small nudge on payment features after label assignment ──
    # Defaulters skew slightly worse, non-defaulters slightly better.
    # This preserves persona diversity (formal_poor_payer still exists with high
    # income + poor payment) while giving models enough signal to reach ~84% accuracy.
    is_def = default == 1
    pct_bills_on_time  = np.clip(pct_bills_on_time  + np.where(is_def, -0.08, +0.05), 0, 1)
    avg_days_late      = np.clip(avg_days_late       + np.where(is_def,  +2.0, -0.5),  0, 20)
    repeat_lateness_count = np.clip(
        repeat_lateness_count + np.where(is_def, +0.5, -0.3), 0, 8)
    # Recompute PDS after adjustment
    pds = payment_discipline_score(pct_bills_on_time, avg_days_late, repeat_lateness_count)

    # ── Enforce 20% overall default rate ─────────────────────────────────────
    target = int(0.20 * n)
    cur    = int(default.sum())
    if cur > target:
        idx = rng.choice(np.where(default == 1)[0], size=cur - target, replace=False)
        default[idx] = 0
    elif cur < target:
        idx = rng.choice(np.where(default == 0)[0], size=target - cur, replace=False)
        default[idx] = 1

    # ── Derive economy_level from income for backward compatibility ───────────
    economy_levels = np.where(
        monthly_income >= 700,  "high",
        np.where(monthly_income >= 200, "middle", "low")
    )

    # ── Remaining features ────────────────────────────────────────────────────
    tx_diversity          = rng.integers(1, 5, n)
    preferred_tx_time     = rng.integers(8, 20, n)
    months_active         = np.clip(
        np.round(24 + 10 * (income_stability - 0.5) + rng.normal(0, 5, n)).astype(int),
        12, 71)
    first_tx_date_months_ago = months_active
    income_to_loan_ratio     = 5000.0 / (monthly_income + 1e-6)

    # ── Build DataFrame ───────────────────────────────────────────────────────
    names = [get_name() for _ in range(n)]
    dobs  = [datetime.now() - timedelta(days=int(a * 365)) for a in ages]

    df = pd.DataFrame({
        "id":                       range(1, n + 1),
        "national_id":              [f"ID-{1000000+i}" for i in range(n)],
        "name":                     names,
        "phone_number":             [f"+26377{1000000+i}" for i in range(n)],
        "date_of_birth":            dobs,
        "location":                 locations,
        "employment_type":          employment,
        "economy_level":            economy_levels,
        "persona":                  persona_names,
        "monthly_income":           monthly_income,
        "income_stability":         income_stability,
        "income_growth":            income_growth,
        "income_to_loan_ratio":     income_to_loan_ratio,
        "monthly_tx_count":         monthly_tx_count,
        "tx_consistency":           tx_consistency,
        "tx_diversity":             tx_diversity,
        "preferred_tx_time":        preferred_tx_time,
        "pct_bills_on_time":        pct_bills_on_time,
        "avg_days_late":            avg_days_late,
        "repeat_lateness_count":    repeat_lateness_count,
        "payment_discipline_score": pds,
        "months_active":            months_active,
        "activity_trend":           activity_trend,
        "device_stability":         device_stability,
        "first_tx_date_months_ago": first_tx_date_months_ago,
        "default":                  default,
        "province":                 provinces,
        "province_risk_index":      prov_risk_idx,
        "income_seasonality_index": income_seas_idx,
        "savings_retention_rate":   savings_retention,
        "bill_type_diversity":      bill_type_div,
        "merchant_to_p2p_ratio":    merchant_p2p,
        "large_tx_frequency":       large_tx_freq,
        "night_tx_ratio":           night_tx_rat,
        "prior_loan_count":         prior_loan_cnt,
        "debt_to_income_ratio":     debt_to_income,
        "recipient_diversity":      recipient_div,
    })

    # ── Diagnostics ───────────────────────────────────────────────────────────
    print(f"\nDefault rate:              {df['default'].mean()*100:.1f}%")
    print(f"Bills/default corr:        {df['pct_bills_on_time'].corr(df['default']):.3f}")
    print(f"Income/default corr:       {df['monthly_income'].corr(df['default']):.3f}")
    print(f"PDS/default corr:          {df['payment_discipline_score'].corr(df['default']):.3f}")

    # Verify the "high income, poor payer" persona scores badly
    fp = df[df['persona'] == 'formal_poor_payer']
    if len(fp):
        print(f"\nformal_poor_payer ({len(fp)} borrowers):")
        print(f"  Avg income:          {fp['monthly_income'].mean():.0f} ZWL")
        print(f"  Avg pct_on_time:     {fp['pct_bills_on_time'].mean():.3f}")
        print(f"  Avg PDS:             {fp['payment_discipline_score'].mean():.1f}/100")
        print(f"  Default rate:        {fp['default'].mean()*100:.1f}%")

    good_hi = df[(df['economy_level'] == 'high') & (df['pct_bills_on_time'] < 0.5)]
    print(f"\nHigh-income poor payers:   {len(good_hi)} borrowers, "
          f"default rate {good_hi['default'].mean()*100:.1f}%")

    out = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "..", "data", "synthetic", "borrowers.csv")
    )
    df.to_csv(out, index=False)
    print(f"\nSaved {len(df)} rows to {out}")
    return df


if __name__ == "__main__":
    generate_data()
