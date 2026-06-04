-- Input Keys
local userTokensKey = KEYS[1]
local spotsKey = KEYS[2]
local classCostKey = KEYS[3]
local bookedSetKey = KEYS[4]
local queueListKey = KEYS[5]

-- Input Arguments
local userId = ARGV[1]
local action = ARGV[2] -- 🔥 EXPECTS: "BOOK" or "CANCEL"

local tokenCost = tonumber(redis.call('GET', classCostKey) or "1")

-- ========================================================
-- 🔥 PATHWAY A: DIRECT CANCELLATION ENGINE
-- ========================================================
if action == "CANCEL" then
    -- Check if they actually have a confirmed booking
    local isBooked = redis.call('SISMEMBER', bookedSetKey, userId)
    
        if isBooked == 1 then
            -- 1. Remove from confirmed booking set and refund their Redis balance
            redis.call('SREM', bookedSetKey, userId)
            redis.call('INCRBY', userTokensKey, tokenCost)
            
            -- 2. Check if a waitlisted user can take this open spot
            local queueLength = redis.call('LLEN', queueListKey)
            
             if queueLength > 0 then
                local nextQueuedUser = redis.call('LPOP', queueListKey)
                if nextQueuedUser then
                    local nextUserTokensKey = "user:" .. nextQueuedUser .. ":tokens"
                    local nextUserTokens = tonumber(redis.call('GET', nextUserTokensKey) or "0")
                    
                    -- Verify if the waitlist person can afford this class
                    if nextUserTokens >= tokenCost then
                        redis.call('SADD', bookedSetKey, nextQueuedUser)
                        redis.call('DECRBY', nextUserTokensKey, tokenCost)
                        
                        return { 
                            "status", "CANCEL_WITH_WAITLIST_UPGRADE", 
                            "upgradedUser", nextQueuedUser, 
                            "message", "Cancelled. Spot passed to waitlist." 
                        }
                    else
                        -- If they cannot afford it, put them back at the front and open the spot up publically
                        redis.call('LPUSH', queueListKey, nextQueuedUser)
                        redis.call('INCR', spotsKey)
                        
                        -- 💡 FIX: Return immediately so your system knows the spot opened up to the public
                        return { 
                            "status", "CANCEL_SUCCESSFUL", 
                            "message", "Booking cancelled. Waitlist user had insufficient tokens, spot opened up." 
                        }
                    end
                end
            else
                -- 💡 FIXED: Waitlist is empty! Simply increase available spaces. 
                -- Removed the broken 'LPUSH' variable crash line completely.
                redis.call('INCR', spotsKey)
        end
            
        return { "status", "CANCEL_SUCCESSFUL", "message", "Booking cancelled successfully." }



    else
        -- User wasn't booked. Check if they are sitting inside the waitlist queue
        local removedCount = redis.call('LREM', queueListKey, 0, userId)
        if removedCount > 0 then
            return { "status", "CANCEL_WAITLIST_SUCCESSFUL", "message", "Removed from the waiting list." }
        end
        
        return { "status", "ERROR_EXIT", "message", "No active booking or waitlist found to cancel." }
    end
end

-- ========================================================
-- PATHWAY B: STANDARD BOOKING ENGINE
-- ========================================================
local memberTokens = tonumber(redis.call('GET', userTokensKey) or "0")
if memberTokens < tokenCost then
    return { "status", "ERROR_EXIT", "message", "Insufficient tokens. This class requires " .. tokenCost .. " credits." }
end

local isAlreadyBooked = redis.call('SISMEMBER', bookedSetKey, userId)
if isAlreadyBooked == 1 then
    return { "status", "REJECTED_DUPLICATE", "message", "You have already booked this class." }
end

local currentSpots = tonumber(redis.call('GET', spotsKey) or "0")
if currentSpots <= 0 then
    redis.call('RPUSH', queueListKey, userId)
    return { "status", "WAITING_QUEUE", "message", "Class full. Added to waiting list." }
end

redis.call('DECR', spotsKey)
redis.call('DECRBY', userTokensKey, tokenCost)
redis.call('SADD', bookedSetKey, userId)

return { "status", "CONFIRMED", "message", "Booking successful!" }

