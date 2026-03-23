const Club = require('../models/Club');

// @route   GET /api/clubs
// @access  Public
const getClubs = async (req, res, next) => {
    try {
        const clubs = await Club.find()
            .populate('createdBy', 'username')
            .select('-posts')  // exclude posts array for light listing
            .sort({ createdAt: -1 });
        // Add memberCount for each club
        const result = clubs.map(c => ({
            ...c.toObject(),
            memberCount: c.members.length,
        }));
        res.json(result);
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/clubs
// @access  Private
const createClub = async (req, res, next) => {
    try {
        const { name, description, genre } = req.body;
        if (!name || name.trim() === '') return res.status(400).json({ message: 'Club name is required' });

        const club = await Club.create({
            name: name.trim(),
            description: description || '',
            genre: genre || 'General',
            createdBy: req.user._id,
            members: [req.user._id], // creator is first member
        });

        // Track joined club on user
        req.user.joinedClubs.push(club._id);
        await req.user.save();

        res.status(201).json(club);
    } catch (err) {
        // Duplicate name → 409 from errorMiddleware (code 11000)
        next(err);
    }
};

// @route   GET /api/clubs/:id
// @access  Public
const getClubById = async (req, res, next) => {
    try {
        const club = await Club.findById(req.params.id)
            .populate('createdBy', 'username avatarUrl')
            .populate('members', 'username avatarUrl')
            .populate('posts.author', 'username avatarUrl');
        if (!club) return res.status(404).json({ message: 'Club not found' });
        res.json(club);
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/clubs/:id/join
// @access  Private
const joinClub = async (req, res, next) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        const alreadyMember = club.members.some(id => id.toString() === req.user._id.toString());
        if (alreadyMember) {
            return res.status(409).json({ message: 'You are already a member of this club' });
        }

        club.members.push(req.user._id);
        await club.save();

        req.user.joinedClubs.push(club._id);
        await req.user.save();

        res.json({ message: `Joined club: ${club.name}`, memberCount: club.members.length });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/clubs/:id/leave
// @access  Private
const leaveClub = async (req, res, next) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        const isMember = club.members.some(id => id.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(400).json({ message: 'You are not a member of this club' });
        }

        club.members = club.members.filter(id => id.toString() !== req.user._id.toString());
        await club.save();

        req.user.joinedClubs = req.user.joinedClubs.filter(id => id.toString() !== club._id.toString());
        await req.user.save();

        res.json({ message: `Left club: ${club.name}` });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/clubs/:id/posts
// @access  Private (members only)
const postInClub = async (req, res, next) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        const isMember = club.members.some(id => id.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: 'Join the club before posting' });
        }

        const { content } = req.body;
        if (!content || content.trim() === '') {
            return res.status(400).json({ message: 'Post content cannot be empty' });
        }

        club.posts.push({ author: req.user._id, content: content.trim() });
        await club.save();

        const newPost = club.posts[club.posts.length - 1];
        res.status(201).json(newPost);
    } catch (err) {
        next(err);
    }
};

// @route   PUT /api/clubs/:id
// @access  Private (creator only)
const updateClub = async (req, res, next) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        if (club.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the club creator can edit this club' });
        }

        const { name, description, genre } = req.body;
        if (name) club.name = name.trim();
        if (description !== undefined) club.description = description;
        if (genre !== undefined) club.genre = genre;

        await club.save();
        res.json(club);
    } catch (err) {
        next(err);
    }
};

// @route   DELETE /api/clubs/:id
// @access  Private (creator only)
const deleteClub = async (req, res, next) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        if (club.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the club creator can delete this club' });
        }

        await club.deleteOne();
        res.json({ message: 'Club deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// @route   DELETE /api/clubs/:id/posts/:postId
// @access  Private (post author or club creator)
const deleteClubPost = async (req, res, next) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        const postIndex = club.posts.findIndex(p => p._id.toString() === req.params.postId);
        if (postIndex === -1) return res.status(404).json({ message: 'Post not found' });

        const post = club.posts[postIndex];
        const isClubCreator = club.createdBy.toString() === req.user._id.toString();
        const isPostAuthor = post.author.toString() === req.user._id.toString();

        if (!isClubCreator && !isPostAuthor) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        club.posts.splice(postIndex, 1);
        await club.save();
        res.json({ message: 'Post deleted' });
    } catch (err) {
        next(err);
    }
};

module.exports = { getClubs, createClub, getClubById, joinClub, leaveClub, postInClub, updateClub, deleteClub, deleteClubPost };
