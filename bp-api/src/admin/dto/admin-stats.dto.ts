export class RecentActivityItem {
  type!: "listen" | "signup" | "purchase";
  userName!: string;
  /** track title for "listen", currency+price for "purchase", null for "signup" */
  detail?: string | null;
  /** only for purchase */
  orderId?: number | null;
  timestamp!: Date;
}

export class AdminStatsDto {
  totalUsers!:              number;
  totalArtists!:            number;
  totalTracks!:             number;
  totalAlbums!:             number;
  totalPlaylists!:          number;
  totalOrders!:             number;
  totalRevenue!:            number;
  streamsToday!:            number;
  donationPoolThisMonth!:   number;
  donationCountThisMonth!:  number;
  totalDonorsThisMonth!:    number;
  recentActivity!: RecentActivityItem[];
}
