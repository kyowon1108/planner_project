/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Team
 * @property {number} id
 * @property {string} name
 * @property {string} description
 * @property {string} created_at
 * @property {string} updated_at
 * @property {TeamMember[]} members
 * @property {number} [owner_id]
 * @property {string} [owner_name]
 * @property {number} [member_count]
 */

/**
 * @typedef {Object} TeamMember
 * @property {number} id
 * @property {number} team_id
 * @property {number} user_id
 * @property {string} role
 * @property {string} joined_at
 * @property {string} [user_name]
 * @property {string} [user_email]
 * @property {Object} [user]
 * @property {number} user.id
 * @property {string} user.name
 * @property {string} user.email
 */

/**
 * @typedef {Object} Planner
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {string} deadline
 * @property {string} status
 * @property {number} team_id
 * @property {number} created_by
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} [creator_name]
 * @property {string} [team_name]
 */

/**
 * @typedef {Object} Todo
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {string} priority
 * @property {string} [due_date]
 * @property {number[]} [assigned_to]
 * @property {boolean} is_completed
 * @property {number} planner_id
 * @property {number} created_by
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} [creator_name]
 * @property {string[]} [assignee_names]
 * @property {string} [status]
 * @property {string} [team_name]
 * @property {string} [planner_name]
 */

/**
 * @typedef {Object} Post
 * @property {number} id
 * @property {string} title
 * @property {string} content
 * @property {number} team_id
 * @property {number} author_id
 * @property {string} [category]
 * @property {string} [tags]
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} [author_name]
 * @property {string} [team_name]
 * @property {number} [like_count]
 * @property {boolean} [is_liked]
 * @property {number} [reply_count]
 */

/**
 * @typedef {Object} Reply
 * @property {number} id
 * @property {string} content
 * @property {number} author_id
 * @property {string} author_name
 * @property {number} post_id
 * @property {string} created_at
 * @property {string} updated_at
 * @property {boolean} is_deleted
 * @property {string} [deleted_at]
 */

/**
 * @typedef {Object} CreateReplyRequest
 * @property {string} content
 * @property {number} post_id
 */

/**
 * @typedef {Object} UpdateReplyRequest
 * @property {string} content
 */

/**
 * @typedef {Object} LoginRequest
 * @property {string} username
 * @property {string} password
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} access_token
 * @property {string} token_type
 */

/**
 * @typedef {Object} RegisterRequest
 * @property {string} name
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} CreateTeamRequest
 * @property {string} name
 * @property {string} description
 */

/**
 * @typedef {Object} CreatePlannerRequest
 * @property {string} title
 * @property {string} description
 * @property {number} team_id
 * @property {string} status
 * @property {string} [deadline]
 */

/**
 * @typedef {Object} CreateTodoRequest
 * @property {string} title
 * @property {string|null} [description]
 * @property {number} planner_id
 * @property {string} priority
 * @property {string|null} [due_date]
 * @property {number[]|null} [assigned_to]
 */

/**
 * @typedef {Object} CreatePostRequest
 * @property {string} title
 * @property {string} content
 * @property {number} team_id
 * @property {string} [category]
 * @property {string} [tags]
 */

/**
 * @typedef {Object} Invite
 * @property {number} id
 * @property {string} code
 * @property {number} team_id
 * @property {number} created_by
 * @property {string} role
 * @property {boolean} is_used
 * @property {string} [expires_at]
 * @property {string} created_at
 */

/**
 * @typedef {Object} CreateInviteRequest
 * @property {number} team_id
 * @property {string} [role]
 * @property {string} [email]
 * @property {string} [expires_at]
 */

/**
 * @typedef {Object} AcceptInviteRequest
 * @property {string} code
 */

/**
 * @typedef {Object} Notification
 * @property {number} id
 * @property {number} user_id
 * @property {string} title
 * @property {string} message
 * @property {string} type
 * @property {boolean} is_read
 * @property {number} [related_id]
 * @property {string} created_at
 */

/**
 * @typedef {Object} ApiError
 * @property {string} detail
 * @property {number} [status_code]
 * @property {string} [message]
 */

/**
 * @typedef {Object} ApiResponse
 * @property {*} data
 * @property {string} [message]
 */ 