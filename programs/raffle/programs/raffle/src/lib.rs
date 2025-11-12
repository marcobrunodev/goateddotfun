use anchor_lang::prelude::*;
use anchor_lang::solana_program::{clock::Clock, hash::hash, system_instruction};

declare_id!("GirBnpwhe5yGXa2DSGLzSkAeHM2K72hJbBsvDhLkXhjk");

// Basis points denominator for percentage calculations
const BPS_DENOMINATOR: u64 = 10000;

#[program]
pub mod raffle {
    use super::*;

    /// Initialize platform configuration (called once on deployment)
    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        admin: Pubkey,
        platform_wallet: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;

        config.admin = admin;
        config.platform_wallet = platform_wallet;
        config.platform_fee_bps = 200;        // 2% initial fee
        config.max_platform_fee_bps = 500;    // 5% maximum
        config.finalization_fee = 5_000_000;  // 0.005 SOL
        config.bump = ctx.bumps.config;

        msg!("Platform initialized");
        msg!("Admin: {}", admin);
        msg!("Platform wallet: {}", platform_wallet);
        msg!("Initial platform fee: {}bps ({}%)", config.platform_fee_bps, config.platform_fee_bps / 100);
        msg!("Max platform fee: {}bps ({}%)", config.max_platform_fee_bps, config.max_platform_fee_bps / 100);

        Ok(())
    }

    /// Update platform fee (admin only)
    pub fn update_platform_fee(
        ctx: Context<UpdatePlatformFee>,
        new_fee_bps: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;

        require!(
            new_fee_bps <= config.max_platform_fee_bps,
            RaffleError::FeeTooHigh
        );

        let old_fee = config.platform_fee_bps;
        config.platform_fee_bps = new_fee_bps;

        msg!("Platform fee updated from {}bps ({}%) to {}bps ({}%)",
            old_fee, old_fee / 100,
            new_fee_bps, new_fee_bps / 100
        );

        Ok(())
    }

    /// Update platform admin (admin only)
    pub fn update_admin(
        ctx: Context<UpdateAdmin>,
        new_admin: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;

        let old_admin = config.admin;
        config.admin = new_admin;

        msg!("Admin transferred from {} to {}", old_admin, new_admin);

        Ok(())
    }

    /// Update platform wallet (admin only)
    pub fn update_platform_wallet(
        ctx: Context<UpdatePlatformWallet>,
        new_platform_wallet: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;

        let old_wallet = config.platform_wallet;
        config.platform_wallet = new_platform_wallet;

        msg!("Platform wallet updated from {} to {}", old_wallet, new_platform_wallet);

        Ok(())
    }

    /// Create a new raffle linked to a tweet
    /// Total cost = prize_amount + platform_fee (dynamic %) + finalization_fee
    pub fn create_raffle(
        ctx: Context<CreateRaffle>,
        tweet_url: String,
        prize_amount: u64,
        end_date: i64,
        winner_count: u32,
        bump: u8,
    ) -> Result<()> {
        let raffle = &mut ctx.accounts.raffle;
        let config = &ctx.accounts.config;
        let clock = Clock::get()?;

        require!(end_date > clock.unix_timestamp, RaffleError::InvalidEndDate);
        require!(prize_amount > 0, RaffleError::InvalidPrizeAmount);
        require!(tweet_url.len() <= 200, RaffleError::TweetUrlTooLong);
        require!(winner_count > 0, RaffleError::InvalidWinnerCount);

        // Calculate platform fee using config
        let platform_fee = prize_amount
            .checked_mul(config.platform_fee_bps)
            .unwrap()
            .checked_div(BPS_DENOMINATOR)
            .unwrap();

        // Total amount needed: prize + platform_fee + finalization_fee
        let total_required = prize_amount
            .checked_add(platform_fee)
            .unwrap()
            .checked_add(config.finalization_fee)
            .unwrap();

        raffle.authority = ctx.accounts.authority.key();
        raffle.platform_wallet = config.platform_wallet;
        raffle.tweet_url = tweet_url;
        raffle.prize_amount = prize_amount;
        raffle.platform_fee = platform_fee;
        raffle.finalization_fee = config.finalization_fee;
        raffle.total_funded = 0;
        raffle.end_date = end_date;
        raffle.created_at = clock.unix_timestamp;
        raffle.is_finalized = false;
        raffle.is_funded = false;
        raffle.winner_count = winner_count;
        raffle.finalized_winners_count = 0;
        raffle.bump = bump;

        msg!("Raffle created for tweet: {}", raffle.tweet_url);
        msg!("Prize pool: {} lamports", raffle.prize_amount);
        msg!("Platform fee ({}%): {} lamports", config.platform_fee_bps / 100, raffle.platform_fee);
        msg!("Finalization fee: {} lamports", raffle.finalization_fee);
        msg!("Total required: {} lamports", total_required);
        msg!("Winners: {}", raffle.winner_count);
        msg!("Ends at: {}", raffle.end_date);

        Ok(())
    }

    /// Fund the raffle with required amount
    /// Must transfer: prize_amount + platform_fee + finalization_fee
    pub fn fund_raffle(ctx: Context<FundRaffle>) -> Result<()> {
        let raffle = &mut ctx.accounts.raffle;

        require!(!raffle.is_finalized, RaffleError::RaffleFinalized);
        require!(!raffle.is_funded, RaffleError::RaffleAlreadyFunded);

        let total_required = raffle.prize_amount
            .checked_add(raffle.platform_fee)
            .unwrap()
            .checked_add(raffle.finalization_fee)
            .unwrap();

        // Transfer total required amount to raffle PDA
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.authority.to_account_info(),
                    to: ctx.accounts.raffle.to_account_info(),
                },
            ),
            total_required,
        )?;

        raffle.total_funded = total_required;
        raffle.is_funded = true;

        msg!("Raffle funded with {} lamports", total_required);

        Ok(())
    }

    /// Finalize raffle and select winners
    /// Participants list is provided from off-chain API
    /// This instruction will be called by a crank/keeper
    pub fn finalize_raffle(
        ctx: Context<FinalizeRaffle>,
        participants: Vec<Pubkey>,
    ) -> Result<()> {
        let raffle = &mut ctx.accounts.raffle;
        let clock = Clock::get()?;

        require!(!raffle.is_finalized, RaffleError::RaffleAlreadyFinalized);
        require!(raffle.is_funded, RaffleError::RaffleNotFunded);
        require!(clock.unix_timestamp >= raffle.end_date, RaffleError::RaffleNotEnded);
        require!(!participants.is_empty(), RaffleError::NoParticipants);
        require!(
            participants.len() >= raffle.winner_count as usize,
            RaffleError::NotEnoughParticipants
        );

        // Generate winners using pseudo-random selection
        let mut selected_winners: Vec<Pubkey> = Vec::new();
        let mut used_indices: Vec<usize> = Vec::new();

        for i in 0..raffle.winner_count {
            let seed = [
                &clock.unix_timestamp.to_le_bytes()[..],
                &i.to_le_bytes()[..],
                &participants.len().to_le_bytes()[..],
            ]
            .concat();

            let hash_result = hash(&seed);
            let random_bytes = &hash_result.to_bytes()[0..8];
            let random_number = u64::from_le_bytes(random_bytes.try_into().unwrap());

            // Find unique winner index
            let mut winner_index = (random_number % participants.len() as u64) as usize;
            let mut attempts = 0;

            while used_indices.contains(&winner_index) && attempts < 100 {
                winner_index = (winner_index + 1) % participants.len();
                attempts += 1;
            }

            if !used_indices.contains(&winner_index) {
                used_indices.push(winner_index);
                selected_winners.push(participants[winner_index]);
            }
        }

        // Store winners in raffle state
        let winners_account = &mut ctx.accounts.winners;
        winners_account.raffle = raffle.key();
        winners_account.winners = selected_winners;
        winners_account.prize_per_winner = raffle.prize_amount / raffle.winner_count as u64;
        winners_account.claimed = vec![false; raffle.winner_count as usize];

        raffle.is_finalized = true;

        // Transfer platform fee to platform wallet
        let raffle_seeds = &[
            b"raffle",
            raffle.tweet_url.as_bytes(),
            &[raffle.bump],
        ];
        let signer_seeds = &[&raffle_seeds[..]];

        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.raffle.to_account_info(),
                    to: ctx.accounts.platform_wallet.to_account_info(),
                },
                signer_seeds,
            ),
            raffle.platform_fee,
        )?;

        msg!("Raffle finalized with {} winners", raffle.winner_count);
        msg!("Prize per winner: {} lamports", winners_account.prize_per_winner);
        msg!("Platform fee transferred: {} lamports", raffle.platform_fee);

        Ok(())
    }

    /// Claim prize - only winners can call this
    pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
        let raffle = &ctx.accounts.raffle;
        let winners = &mut ctx.accounts.winners;

        require!(raffle.is_finalized, RaffleError::RaffleNotFinalized);

        // Find winner index
        let winner_position = winners
            .winners
            .iter()
            .position(|w| w == ctx.accounts.winner.key)
            .ok_or(RaffleError::NotWinner)?;

        require!(
            !winners.claimed[winner_position],
            RaffleError::AlreadyClaimed
        );

        // Mark as claimed
        winners.claimed[winner_position] = true;

        // Transfer prize to winner
        let raffle_seeds = &[
            b"raffle",
            raffle.tweet_url.as_bytes(),
            &[raffle.bump],
        ];
        let signer_seeds = &[&raffle_seeds[..]];

        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.raffle.to_account_info(),
                    to: ctx.accounts.winner.to_account_info(),
                },
                signer_seeds,
            ),
            winners.prize_per_winner,
        )?;

        raffle.finalized_winners_count += 1;

        msg!(
            "Prize claimed by winner {}: {} lamports",
            ctx.accounts.winner.key(),
            winners.prize_per_winner
        );

        Ok(())
    }

}

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + PlatformConfig::INIT_SPACE,
        seeds = [b"platform-config"],
        bump
    )]
    pub config: Account<'info, PlatformConfig>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePlatformFee<'info> {
    #[account(
        mut,
        seeds = [b"platform-config"],
        bump = config.bump,
        has_one = admin
    )]
    pub config: Account<'info, PlatformConfig>,

    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateAdmin<'info> {
    #[account(
        mut,
        seeds = [b"platform-config"],
        bump = config.bump,
        has_one = admin
    )]
    pub config: Account<'info, PlatformConfig>,

    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdatePlatformWallet<'info> {
    #[account(
        mut,
        seeds = [b"platform-config"],
        bump = config.bump,
        has_one = admin
    )]
    pub config: Account<'info, PlatformConfig>,

    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(tweet_url: String, prize_amount: u64, end_date: i64, winner_count: u32, bump: u8)]
pub struct CreateRaffle<'info> {
    #[account(
        seeds = [b"platform-config"],
        bump = config.bump
    )]
    pub config: Account<'info, PlatformConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + Raffle::INIT_SPACE,
        seeds = [b"raffle", tweet_url.as_bytes()],
        bump
    )]
    pub raffle: Account<'info, Raffle>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundRaffle<'info> {
    #[account(
        mut,
        has_one = authority
    )]
    pub raffle: Account<'info, Raffle>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeRaffle<'info> {
    #[account(
        mut,
        has_one = authority,
        has_one = platform_wallet
    )]
    pub raffle: Account<'info, Raffle>,

    #[account(
        init,
        payer = authority,
        space = 8 + Winners::INIT_SPACE,
        seeds = [b"winners", raffle.key().as_ref()],
        bump
    )]
    pub winners: Account<'info, Winners>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Platform wallet to receive fees
    #[account(mut)]
    pub platform_wallet: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut)]
    pub raffle: Account<'info, Raffle>,

    #[account(
        mut,
        seeds = [b"winners", raffle.key().as_ref()],
        bump
    )]
    pub winners: Account<'info, Winners>,

    #[account(mut)]
    pub winner: Signer<'info>,

    pub system_program: Program<'info, System>,
}


#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    pub admin: Pubkey,                    // 32 - Admin wallet
    pub platform_wallet: Pubkey,          // 32 - Wallet that receives fees
    pub platform_fee_bps: u64,           // 8 - Platform fee in basis points
    pub max_platform_fee_bps: u64,       // 8 - Maximum allowed fee (500 = 5%)
    pub finalization_fee: u64,           // 8 - Fee to cover finalization costs
    pub bump: u8,                        // 1 - PDA bump
}

#[account]
#[derive(InitSpace)]
pub struct Raffle {
    pub authority: Pubkey,              // 32
    pub platform_wallet: Pubkey,        // 32
    #[max_len(200)]
    pub tweet_url: String,              // 4 + 200 = 204
    pub prize_amount: u64,              // 8 - Base prize pool (what creator specifies)
    pub platform_fee: u64,              // 8 - 2% platform fee
    pub finalization_fee: u64,          // 8 - Fee to cover closing costs
    pub total_funded: u64,              // 8 - Total amount deposited
    pub end_date: i64,                  // 8
    pub created_at: i64,                // 8
    pub is_finalized: bool,             // 1
    pub is_funded: bool,                // 1
    pub winner_count: u32,              // 4 - Number of winners
    pub finalized_winners_count: u8,    // 1 - How many have claimed
    pub bump: u8,                       // 1
}

#[account]
#[derive(InitSpace)]
pub struct Winners {
    pub raffle: Pubkey,                 // 32
    #[max_len(100)]
    pub winners: Vec<Pubkey>,           // 4 + (32 * 100) = 3204 - Max 100 winners
    pub prize_per_winner: u64,          // 8 - Prize amount divided by winner count
    #[max_len(100)]
    pub claimed: Vec<bool>,             // 4 + (1 * 100) = 104 - Track who claimed
}

#[error_code]
pub enum RaffleError {
    #[msg("End date must be in the future")]
    InvalidEndDate,

    #[msg("Prize amount must be greater than 0")]
    InvalidPrizeAmount,

    #[msg("Tweet URL is too long (max 200 characters)")]
    TweetUrlTooLong,

    #[msg("Winner count must be at least 1")]
    InvalidWinnerCount,

    #[msg("Raffle has already been finalized")]
    RaffleAlreadyFinalized,

    #[msg("Raffle is already finalized")]
    RaffleFinalized,

    #[msg("Raffle has not been funded yet")]
    RaffleNotFunded,

    #[msg("Raffle is already funded")]
    RaffleAlreadyFunded,

    #[msg("Raffle has not ended yet")]
    RaffleNotEnded,

    #[msg("No participants in raffle")]
    NoParticipants,

    #[msg("Not enough participants for the number of winners")]
    NotEnoughParticipants,

    #[msg("Raffle has not been finalized yet")]
    RaffleNotFinalized,

    #[msg("You are not a winner")]
    NotWinner,

    #[msg("Prize already claimed")]
    AlreadyClaimed,

    #[msg("Platform fee cannot exceed maximum (500 basis points / 5%)")]
    FeeTooHigh,
}
