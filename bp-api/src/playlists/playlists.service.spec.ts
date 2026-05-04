import { Test, TestingModule } from "@nestjs/testing";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";

import { PlaylistsService } from "./playlists.service";
import { Playlist } from "../entities/playlist.entity";
import { PlaylistTrack } from "../entities/playlist-track.entity";
import { Track } from "../entities/track.entity";
import { TrackArtist } from "../entities/track-artist.entity";
import { EngagementActionService } from "../royalty/engagement-action.service";
import { EngagementActionType } from "../entities/engagement-action.entity";
import { CloudFrontService } from "../common/cloudfront.service";
import { Role } from "../entities/role.enum";

interface MockRepo {
  findOne: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  delete: jest.Mock;
  createQueryBuilder: jest.Mock;
}

const newRepo = (): MockRepo => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn((x) => x),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe("PlaylistsService", () => {
  let service: PlaylistsService;
  let playlistRepo: MockRepo;
  let playlistTrackRepo: MockRepo;
  let trackRepo: MockRepo;
  let trackArtistRepo: MockRepo;
  let engagement: { record: jest.Mock };

  /**
   * Mock public findOne(id) — interní volání po update/addTrack rebuilduje
   * playlist přes query builder; pro unit test ho jen přepneme na stub,
   * abychom se vyhnuli mockování celého řetězce leftJoinAndSelect().
   */
  const stubPublicFindOne = (returnValue: Record<string, unknown>) => {
    jest
      .spyOn(service, "findOne")
      .mockResolvedValue(returnValue as never);
  };

  beforeEach(async () => {
    playlistRepo = newRepo();
    playlistTrackRepo = newRepo();
    trackRepo = newRepo();
    trackArtistRepo = newRepo();
    engagement = { record: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaylistsService,
        { provide: getRepositoryToken(Playlist), useValue: playlistRepo },
        { provide: getRepositoryToken(PlaylistTrack), useValue: playlistTrackRepo },
        { provide: getRepositoryToken(Track), useValue: trackRepo },
        { provide: getRepositoryToken(TrackArtist), useValue: trackArtistRepo },
        { provide: EngagementActionService, useValue: engagement },
        { provide: CloudFrontService, useValue: { signUrl: (s: string) => s } },
      ],
    }).compile();

    service = module.get<PlaylistsService>(PlaylistsService);
  });

  // ---------------------------------------------------------------------------
  describe("create", () => {
    it("creates and returns the saved playlist via findOne", async () => {
      playlistRepo.save.mockResolvedValue({ id: 100 });
      stubPublicFindOne({ id: 100, title: "My Mix", userId: 7 });

      const result = await service.create(
        { title: "My Mix" } as never,
        7,
      );

      expect(playlistRepo.save).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 100, userId: 7 });
    });
  });

  // ---------------------------------------------------------------------------
  describe("update", () => {
    it("allows update by the owner", async () => {
      playlistRepo.findOne.mockResolvedValue({
        id: 1,
        userId: 7,
        isSystem: false,
      });
      playlistRepo.save.mockResolvedValue({});
      stubPublicFindOne({ id: 1, title: "Renamed", userId: 7 });

      const result = await service.update(
        1,
        { title: "Renamed" } as never,
        7,
        [Role.LISTENER],
      );

      expect(result.title).toBe("Renamed");
      expect(playlistRepo.save).toHaveBeenCalled();
    });

    it("throws ForbiddenException when a non-owner tries to update", async () => {
      playlistRepo.findOne.mockResolvedValue({
        id: 1,
        userId: 7,
        isSystem: false,
      });

      await expect(
        service.update(
          1,
          { title: "Hijacked" } as never,
          999, // someone else
          [Role.LISTENER],
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(playlistRepo.save).not.toHaveBeenCalled();
    });

    it("allows admin to update anyone's playlist", async () => {
      playlistRepo.findOne.mockResolvedValue({
        id: 1,
        userId: 7,
        isSystem: false,
      });
      playlistRepo.save.mockResolvedValue({});
      stubPublicFindOne({ id: 1, title: "Moderated", userId: 7 });

      const result = await service.update(
        1,
        { title: "Moderated" } as never,
        999,
        [Role.ADMIN],
      );

      expect(result.title).toBe("Moderated");
    });

    it("throws ForbiddenException when target playlist is a system playlist", async () => {
      playlistRepo.findOne.mockResolvedValue({
        id: 1,
        userId: 7,
        isSystem: true,
      });

      await expect(
        service.update(1, { title: "X" } as never, 7, [Role.LISTENER]),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("throws NotFoundException when playlist does not exist", async () => {
      playlistRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update(404, { title: "X" } as never, 7, [Role.LISTENER]),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  describe("addTrack", () => {
    it("adds a track and records an engagement action with the primary artist", async () => {
      playlistRepo.findOne.mockResolvedValue({ id: 1, userId: 7 });
      trackRepo.findOne.mockResolvedValue({ id: 50, durationSeconds: 180 });
      playlistTrackRepo.findOne.mockResolvedValue(null);
      playlistTrackRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: 4 }),
      });
      playlistTrackRepo.save.mockResolvedValue({});
      trackArtistRepo.findOne.mockResolvedValue({ artistId: 30 });
      stubPublicFindOne({ id: 1, userId: 7 });

      await service.addTrack(1, 50, 7, [Role.LISTENER]);

      expect(playlistTrackRepo.save).toHaveBeenCalledWith({
        playlistId: 1,
        trackId: 50,
        position: 5, // 4 + 1
      });
      expect(engagement.record).toHaveBeenCalledWith(7, {
        actionType: EngagementActionType.ADD_TO_PLAYLIST,
        artistId: 30,
        trackId: 50,
      });
    });

    it("throws ForbiddenException when a non-owner tries to add a track", async () => {
      playlistRepo.findOne.mockResolvedValue({ id: 1, userId: 7 });

      await expect(
        service.addTrack(1, 50, 999, [Role.LISTENER]),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(playlistTrackRepo.save).not.toHaveBeenCalled();
    });
  });
});
